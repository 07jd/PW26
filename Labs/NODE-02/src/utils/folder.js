import path from "path";

const root_folder = path.dirname(import.meta.dirname);
const folder = 
{
    root: root_folder,
    routes: path.join(root_folder, "routes"),
    public: path.join(root_folder, "public"),
    shared: path.join(root_folder, "shared")
};

export default folder;