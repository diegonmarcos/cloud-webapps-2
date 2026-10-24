import { h as head } from "../../chunks/index.js";
function _layout($$renderer, $$props) {
  let { children } = $$props;
  head("12qhfyh", $$renderer, ($$renderer2) => {
    $$renderer2.title(($$renderer3) => {
      $$renderer3.push(`<title>My Maps</title>`);
    });
    $$renderer2.push(`<meta name="description" content="Self-hosted maps with multi-provider API support"/> <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/> <link rel="preconnect" href="https://basemaps.cartocdn.com"/> <link rel="preconnect" href="https://nominatim.openstreetmap.org"/> <link rel="preconnect" href="https://photon.komoot.io"/>`);
  });
  children($$renderer);
  $$renderer.push(`<!---->`);
}
export {
  _layout as default
};
