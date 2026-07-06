declare module "@prisma/nextjs-monorepo-workaround-plugin" {
  import type webpack from "webpack";
  export class PrismaPlugin implements webpack.WebpackPluginInstance {
    apply(compiler: webpack.Compiler): void;
  }
}
