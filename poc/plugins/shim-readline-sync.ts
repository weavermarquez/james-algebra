import path from "path";

const shimReadlinePlugin = {
  name: "shim-readline-sync",
  setup(builder: any) {
    builder.onResolve({ filter: /^readline-sync$/ }, () => ({
      path: path.resolve("src/shims/readline-sync.ts"),
    }));
  },
};

export default shimReadlinePlugin;
