// https://github.com/vitejs/vite/blob/main/packages/playground/ssr-vue/server.js
import * as fs from "fs";
import * as path from "path";
import express from "express";
import { ViteDevServer } from "vite";

const isTest = process.env.NODE_ENV === "test" || !!process.env.VITE_TEST_BUILD;

async function createServer(
  root = process.cwd(),
  isProd = process.env.NODE_ENV === "production"
) {
  const resolve = (p: string) => path.resolve(__dirname, "./", p);

  const indexProd = isProd
    ? fs.readFileSync(resolve("./dist/client/index.html"), "utf-8")
    : "";

  const manifest = isProd
    ? // @ts-ignore
      JSON.parse(
        fs.readFileSync(resolve("./dist/client/ssr-manifest.json"), "utf-8")
      )
    : {};

  const app = express();

  let vite: ViteDevServer;
  if (!isProd) {
    vite = await import("vite").then((viteModule) =>
      viteModule.createServer({
        root,
        logLevel: isTest ? "error" : "info",
        server: {
          middlewareMode: "ssr",
          watch: {
            // During tests we edit the files too fast and sometimes chokidar
            // misses change events, so enforce polling for consistency
            usePolling: true,
            interval: 100,
          },
        },
      })
    );
    // use vite's connect instance as middleware
    app.use(vite.middlewares);
  } else {
    app.use(
      await import("compression").then((compressionModule) =>
        compressionModule.default()
      )
    );
    app.use(
      await import("serve-static").then((serveStaticModule) =>
        serveStaticModule.default(resolve("./dist/client"), {
          index: false,
        })
      )
    );
  }

  app.use("*", async (req, res) => {
    try {
      const url = req.originalUrl;

      let template;
      let render: typeof import("./src/entry-server")["render"];
      if (!isProd) {
        // console.log("dev mode");
        // always read fresh template in dev
        template = fs.readFileSync(resolve("index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        render = (await vite.ssrLoadModule(resolve("./src/entry-server.ts")))
          .render;
      } else {
        // console.log("prod mode");
        template = indexProd;
        // @ts-ignore
        render = await import(resolve("./dist/server/entry-server.js")).then(
          (serverEntry) => serverEntry.render
        );
      }

      const { appHtml, cssHtml, preloadLinks } = await render(url, manifest);

      const html = template
        .replace(`<!--preload-links-->`, preloadLinks)
        .replace(`<!--ssr-outlet-->`, cssHtml)
        .replace(`<!--app-html-->`, appHtml);

      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (e) {
      // if (!isProd)
      if (vite) {
        vite.ssrFixStacktrace(e as Error);
      }
      console.log((e as Error).stack);
      res.status(500).end((e as Error).stack);
    }
  });

  // @ts-ignore
  return { app, vite };
}

if (!isTest) {
  createServer().then(({ app }) =>
    app.listen(3000, () => {
      console.log("Server listening on http://localhost:3000");
    })
  );
}

// for test use
export default createServer;
