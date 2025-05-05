import { Application, Router } from "express";

function printRoutes(app: Application | Router, parentPath = "") {
  // Truy cập stack từ _router hoặc stack trực tiếp
  const stack = (app as any)._router?.stack || (app as any).stack;

  if (!stack) {
    console.log("No routes found.");
    return;
  }

  stack.forEach((layer: any) => {
    if (layer.route) {
      // Route layer
      const routePath = parentPath + layer.route.path;
      const methods = Object.keys(layer.route.methods)
        .map((method) => method.toUpperCase())
        .join(", ");
      console.log(`${methods} ${routePath}`);
    } else if (layer.name === "router" && layer.handle.stack) {
      // Router layer
      const match = layer.regexp?.source.match(/\/\^\\\/(.*?)\\\/\?\$/);
      const subRouterPath = parentPath + (match ? `/${match[1]}` : "");
      printRoutes(layer.handle, subRouterPath);
    }
  });
}

export { printRoutes };