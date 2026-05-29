// Call after auth middleware
export function adminPage(req, res, next)
{
    const user_info = req.user;
    if(!user_info) return res.status(403).send();

    if(user_info.role !== "Administrador") return res.status(403).send();
        
    next();
}

export function supervisorPage(req, res, next)
{
    const user_info = req.user;
    if(!user_info) return res.status(403).send();

    if(user_info.role === "Técnico") return res.status(403).send();
        
    next();
}