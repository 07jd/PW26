import path from "path"

const project_root = path.resolve("../");
const dist_folder = path.join(project_root, "client/dist/");
const routes_folder = path.join(project_root, "server/src/routes/");

const folder = {
    root: project_root,
    public: dist_folder, 
    routes: routes_folder,
    get_page(name)
    {
        if(name.endsWith(".html")) 
            return path.join(folder.public, name);

        return path.join(folder.public, (name + ".html"));
    } 
};

export default folder;