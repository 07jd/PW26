import jwt from "jsonwebtoken"
const ACCESS_SECRET = process.env.JWT_SECRET_ACCESS;

// Used by GET /auth
// If client has a valid access_token, redirects to /dashboard
// if not, continues to /auth page 
export function redirectToDashboard(req, res, next)
{
    try
    {
        const token = req.cookies["access_token"];
        jwt.verify(token, ACCESS_SECRET);
        res.redirect("/dashboard");
    } catch(e) 
    {
        next();
    }
}

// Used by GET /dashboard
// If client has a valid access_token, continues to /dashboard
// if not, redirects to /auth page 
export function redirectToAuth(req, res, next)
{
    try
    {
        const token = req.cookies["access_token"];
        jwt.verify(token, ACCESS_SECRET);
        next();
    } catch(e) 
    {
        res.redirect("/auth");
    }
}

// On success, continues to endpoint
// On failure, return code 401
export default function AuthApi(req, res, next)
{
    try
    {
        const token = req.cookies["access_token"];
        const decoded = jwt.verify(token, ACCESS_SECRET);
        req.user = decoded;
        return next();
    }
    catch(_e)
    {
        return res.status(401).send();
    } 
}