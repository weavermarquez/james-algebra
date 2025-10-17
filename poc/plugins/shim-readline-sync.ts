import path from "path";

const READLINE_FILTER = /^readline-sync$/;
const CORE_FILTER = /tau-prolog[\\/]+modules[\\/]+core\.js$/;
const CORE_PREFIX =
  "var tau_file_system, tau_user_input, tau_user_output, tau_user_error, nodejs_file_system, nodejs_user_input, nodejs_user_output, nodejs_user_error;\n";

const shimReadlinePlugin = {
  name: "shim-readline-sync",
  setup(builder: any) {
    builder.onResolve({ filter: READLINE_FILTER }, () => ({
      path: path.resolve("src/shims/readline-sync.ts"),
    }));

    builder.onLoad({ filter: CORE_FILTER }, async (args: any) => {
      const original = await Bun.file(args.path).text();
      return {
        contents: `${CORE_PREFIX}${original}`,
        loader: "js",
      };
    });
  },
};

export default shimReadlinePlugin;
