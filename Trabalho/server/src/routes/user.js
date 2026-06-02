import { Router } from "express"
import userModel from "../models/user.js"
import jwt from "jsonwebtoken"
import authMiddleware from "../middleware/authMiddlewares.js"
import { adminPage } from "../middleware/roleMiddlewares.js";
import { errorToJson } from "../util/db.js"
import mongoose from "mongoose";

const route_name = "/user";
const router = Router();
export { route_name, router };

const ACCESS_SECRET = process.env.JWT_SECRET_ACCESS;
const REFRESH_SECRET = process.env.JWT_SECRET_REFRESH;

const JWT_ACCESS_TOKEN_LIFETIME = "30m";
const COOKIE_ACCESS_TOKEN_LIFETIME = 30 * (1000 * 60);
const JWT_REFRESH_TOKEN_LIFETIME = "3d";
const COOKIE_REFRESH_TOKEN_LIFETIME = 3 * (1000 * 60 * 60 * 24);


function genAccessToken(id, role)
{
    const token = jwt.sign({
        id: id,
        role: role
    }, 
    ACCESS_SECRET, 
    {expiresIn: JWT_ACCESS_TOKEN_LIFETIME});

    return token;
}

function genRefreshToken(id)
{
    const token = jwt.sign({
        id: id
    }, 
    REFRESH_SECRET, 
    {expiresIn: JWT_REFRESH_TOKEN_LIFETIME});

    return token;
}

// On success (200), return json with user info (username, email, role)
// On failure
//      401 - Auth invalid
//      404 - User not found
//      500 - Server error
router.get("/me", authMiddleware, async (req,res) => {
    try
    {
        console.log(req.user.id);
        const user = await userModel.findById(req.user.id);
        if (!user) return res.status(404).send();

        res.status(200).json({
            username: user.username,
            email: user.email,
            role: user.role
        });
    }
    catch(e)
    {
        console.log("[GET: /user/me] Failed error: " + e);
        res.status(500).send();
    }
})

// Login User endpoint
// On sucess (code 200): store jwt token in user cookies and returns code.
// On error (code: 400/500) return json of type (ex):
// {
//    type: "validation",
//    errors: {
//        identifier: "Utilizador não encontrado"
//    }
// }
router.post("/login", async (req,res) => {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    if (!username && !email) return res.status(400).json({
        type: "validation",
        errors: {
            identifier: "Email ou Username em falta"     
        }
    });

    if (!password) return res.status(400).json({
        type: "validation",
        errors: {
            password: "Password em falta"
        }
    });

    try
    {
        let user = null;
        if(username) user = await userModel.findOne({ username: username });
        else user = await userModel.findOne({ email: email });

        if(!user) return res.status(400).json({
            type: "validation",
            errors: {
                identifier: "Utilizador não encontrado"
            }
        });

        const correct_password = await user.isPasswordCorrect(password);
        if (!correct_password) return res.status(400).json({
            type: "auth",
            errors: {
                password: "Password incorreta"
            }
        });

        // Gen jwt, store in cookies and redirect to dashboard
        const access_token = genAccessToken(user.id, user.role);
        const refresh_token = genRefreshToken(user.id);

        res.cookie("access_token", access_token, {
            httpOnly: false,
            secure: false,                  // true if using https
            sameSite: "strict",              
            maxAge: COOKIE_ACCESS_TOKEN_LIFETIME,
        });

        res.cookie("refresh_token", refresh_token, {
            httpOnly: true,                 
            secure: false,              
            sameSite: "strict",              
            maxAge: COOKIE_REFRESH_TOKEN_LIFETIME,
        });

        user.refreshTokens.push(refresh_token);
        await user.save();

        res.status(200).send();
    }
    catch(e)
    {
        console.log("[POST /user/login] Error: " + e);
        return res.status(500).json({
            type: "server",
            errors: {
                message: "Tente novamente mais tarde"
            }
        })
    }
})

// Logs out user
router.post("/logout", async (req,res) => {
    const usr_refresh_token = req.cookies["refresh_token"];
    if(usr_refresh_token)
    {
        const decoded = jwt.verify(usr_refresh_token, REFRESH_SECRET);
        const user = await userModel.findById(decoded.id);

        if(user)
        {
            user.refreshTokens = user.refreshTokens.filter(token => token !== usr_refresh_token);
            await user.save();
        }
    }

    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    res.status(200).send();
})

// Gen new access_token from refresh_token
// 200 - New access_token and refresh_token
// 401 - No refresh_token
// 403 - Invalid refresh_token (expired or already used)
// 500 - Server error
router.post("/refresh", async (req,res) => {
    try
    {
        const usr_refresh_token = req.cookies["refresh_token"];
        if(!usr_refresh_token) return res.status(401).send();

        const user = await userModel.findOne({ refreshTokens: usr_refresh_token });
        if (!user)
        {
            try
            {
                // Token not in list of refresh tokens
                // If token is still valid, means that it was duplicated
                // so remove every token in list for precausion
                const decoded = jwt.verify(usr_refresh_token, REFRESH_SECRET);
                const user_dup_token = await userModel.findById(decoded.id);
                if(user_dup_token)
                {
                    user_dup_token.refreshTokens = [];
                    await user_dup_token.save();
                }

                return res.status(403).send();
            }
            catch(e)
            {
                return res.status(403).send();
            }
        }

        
        // Remove old and add new refresh token
        const new_refresh_token = genRefreshToken(user.id);
        user.refreshTokens = user.refreshTokens.filter(token => token !== usr_refresh_token);
        user.refreshTokens.push(new_refresh_token);
        await user.save();

        const new_access_token = genAccessToken(user.id, user.role);
        res.cookie("access_token", new_access_token, {
            httpOnly: false,
            secure: false,
            sameSite: "strict",
            maxAge: COOKIE_ACCESS_TOKEN_LIFETIME
        });

        res.cookie("refresh_token", new_refresh_token, {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
            maxAge: COOKIE_REFRESH_TOKEN_LIFETIME
        });

        res.status(200).send();
    }
    catch(e)
    {
        res.status(500).send();
    }
})

// Updates data from user,
// Can only update email/password/username
// 200 - Sucess
// 400 - Invalid params
// 401 - Auth invalid
// 403 - Insuficient permissions
router.patch("/", authMiddleware, async (req,res) => {
    try
    {
        // Clean up input
        const data = req.body;
        const user_id = req.user.id;
        const allowed_fields = ["username", "password", "email"];
        const clean_input = {};
        for(const [key, value] of Object.entries(data))
        {
            if(allowed_fields.includes(key)) clean_input.key = value;
        }

        if(!clean_input) return res.status(400).json({
            type: "validation",
            errors: {
                message: "No valid data in body"
            }
        });

        const user = await userModel.findById(user_id);
        if (!user) return res.status(404).send();

        Object.assign(user, data);
        await user.save();
        return res.status(200).json(user);
    }
    catch(e)
    {
        console.log("[PATCH /user/update] Error: " + e);
        errorToJson(e, res);
    }
});


// Returns 200 if in a valid session
router.get("/session", authMiddleware, async (_req,res) => {
    return res.status(200).send();
})


/*
* Admin endpoints,
*/

// Register user
router.post("/register", authMiddleware, adminPage, async (req,res) => {
    try
    {
        const input_data = req.body;
        await userModel.create(input_data);
        res.status(200).send();
    }
    catch 
    { 
        errorToJson(e, res); 
    }
})

// Update user info
router.patch("/update/:id", authMiddleware, adminPage, async (req,res) => {
    const id = req.params.id;
    const data =req.body;
    if(!mongoose.isValidObjectId(id) || !data) return res.status(400).send();

    try
    {
        const user = await userModel.findById(id);
        if(!user) return res.status(404).send();

        Object.assign(user, data);
        await user.save();

        return res.status(200).send();
    }
    catch(e)
    {
        errorToJson(e, res);
    }
})

// Get all users
router.get("/", authMiddleware, adminPage, async (_req, res) => {
    try
    {
        const users = await userModel.find({}).lean();
        const clean = users.map(({ _id, password, ...rest }) => ({
            id: _id,
            ...rest
        }));

        return res.status(200).send(clean);
    }
    catch(e)
    {
        console.log(e);
        return res.status(500).send();
    }
})

// Get by email
router.get("/:email", authMiddleware, adminPage, async (req, res) => {
    try
    {
        const email_input = req.params.email;
        if(!email_input) return res.status(400).send();

        const user = await userModel.findOne({email: email_input}).lean();
        if (!user) return res.status(404).send();
        
        const clean = {
            id: user._id,
            ...user
        };
        delete clean._id;

        return res.status(200).send(clean);
    }
    catch(e)
    {
        console.log(e);
        return res.status(500).send();
    }
})