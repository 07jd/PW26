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

// Register User endpoint
// On sucess (code 200): store jwt token in user cookies and return code 200
// On error (code: 400/500) return json of type (ex):
// {
//    type: "duplicated",
//    errors: {
//        email: "Email já em uso"
//    }
// }
router.post("/register", authMiddleware, adminPage, async (req,res) => {
    try
    {
        const input_data = req.body;
        const user_raw = await userModel.create(input_data);
        const user = {
            id: user_raw._id,
            ...user_raw
        };
        delete user._id;

        res.status(200).json(user);
    }
    catch(e) { errorToJson(e, res); }
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
        console.log("[POST /user/refresh] Error: " + e);
        res.status(500).send();
    }
})

// Updates data from user,
// an admin can pass "id" on body to change another user's data
// On error returns the same error messages as the /register endpoint
// 200 - Sucess
// 400 - Invalid params
// 401 - Auth invalid
// 403 - Insuficient permissions
router.patch("/", authMiddleware, async (req,res) => {
    try
    {
        const data = req.body;
        if(!data) return res.status(400).json({
            type: "validation",
            errors: {
                message: "No data in body"
            }
        });


        // Admin can change anybody's data and its own
        // Other users can only change own data excluding role parameter
        const token = req.user;
        const allowed_fields = ["username", "password", "email", "id", "role"];
        let target_id = token.id;

        Object.keys(data).forEach((key) => {
            if(!allowed_fields.includes(key))
            {
                return res.status(400).json({
                    type: "validation",
                    errors: {
                        message: "Parametros inválidos"
                    }
                });
            }
        })

        // If its an admin doing the request, use provided id in body
        // if not present, continue but 
        if (token.role === "Administrador" && data.id)
        {
            target_id = data.id;
            delete data.id;
        }

        // No user can change its role, only admins
        if(token.role !== "Administrador" && (data.role || data.id)) return res.status(403).json({
            type: "validation",
            errors: {
                message: "Afim de atualizar esses campos é necessário ser administrador"
            }
        });

        const user = await userModel.findById(target_id);
        if (!user) return res.status(404).json({
            type: "update",
            errors: {
                message: "Não foi possível achar um utilizador com o id fornecido"
            }
        });

        Object.assign(user, data);
        await user.save();
        res.status(200).json(user);
    }
    catch(e)
    {
        console.log("[PATCH /user/update] Error: " + e);
        errorToJson(e, res);
    }
});

// Get user by id
// only returns basic info (id, email, username)
router.get("/search/:id", authMiddleware, async (req, res) => {
    try
    {
        const id = req.params.id;
        if(!mongoose.isValidObjectId(id)) return res.status(400).send();

        const user = await userModel.findById(id, "username email");
        if(!user) return res.status(404).send();

        return res.status(200).json({
            id: id,
            username: user.username,
            email: user.email
        });
    }
    catch(e)
    {
        console.log(e);
        return res.status(500).send();
    }
})

router.get("/session", authMiddleware, async (_req,res) => {
    return res.status(200).send();
})

/*
* Admin endpoints,
* get users full info
*/
router.get("/", authMiddleware, adminPage, async (_req, res) => {
    try
    {
        const users = await userModel.find({}).lean();
        const clean = users.map(({ _id, ...rest }) => ({
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