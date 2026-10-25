
import root from '../root.js';
import { set_building, set_prerendering } from '$app/env/internal';
import { set_assets } from '$app/paths/internal/server';
import { set_manifest, set_read_implementation } from '__sveltekit/server';
import { set_private_env, set_public_env } from '../../../../../node_modules/@sveltejs/kit/src/runtime/shared-server.js';
import error from '../shared/error-template.js';

export const options = {
	app_template_contains_nonce: false,
	async: false,
	csp: {"mode":"auto","directives":{"upgrade-insecure-requests":false,"block-all-mixed-content":false},"reportOnly":{"upgrade-insecure-requests":false,"block-all-mixed-content":false}},
	csrf_check_origin: true,
	csrf_trusted_origins: [],
	embedded: false,
	env_public_prefix: 'PUBLIC_',
	env_private_prefix: '',
	hash_routing: false,
	hooks: null, // added lazily, via `get_hooks`
	preload_strategy: "modulepreload",
	root,
	service_worker: false,
	service_worker_options: undefined,
	server_error_boundaries: false,
	templates: {
		app: ({ head, body, assets, nonce, env }) => "<!DOCTYPE html>\n<html lang=\"en\">\n\t<head>\n\t\t<meta charset=\"utf-8\" />\n\t\t<link rel=\"icon\" type=\"image/svg+xml\" href=\"" + assets + "/favicon.svg\" />\n\t\t<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n\t\t" + head + "\n<!-- Matomo Tag Manager --><script>var _mtm = window._mtm = window._mtm || [];_mtm.push({'mtm.startTime': (new Date().getTime()), 'event': 'mtm.Start'});(function() {  var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];  g.async=true; g.src='https://analytics.diegonmarcos.com/matomo/js/container_odwLIyPV.js';  s.parentNode.insertBefore(g,s);})();</script><!-- End Matomo Tag Manager -->\n<!-- Umami Analytics -->\n<script async src=\"https://analytics.diegonmarcos.com/umami/script.js\" data-website-id=\"937cbde7-5ec2-450c-9d6a-8117423ac12f\"></script>\n<!-- End Umami Analytics -->\n\t</head>\n\t<body data-sveltekit-preload-data=\"hover\">\n\t\t<div style=\"display: contents\">" + body + "</div>\n\t</body>\n</html>\n",
		error
	},
	version_hash: "hwu9i3"
};

export async function get_hooks() {
	let handle;
	let handleFetch;
	let handleError;
	let handleValidationError;
	let init;
	

	let reroute;
	let transport;
	

	return {
		handle,
		handleFetch,
		handleError,
		handleValidationError,
		init,
		reroute,
		transport
	};
}

export { set_assets, set_building, set_manifest, set_prerendering, set_private_env, set_public_env, set_read_implementation };
