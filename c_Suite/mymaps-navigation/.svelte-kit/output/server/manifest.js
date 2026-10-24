export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.svg"]),
	mimeTypes: {".svg":"image/svg+xml"},
	_: {
		client: {start:"_app/immutable/entry/start.Bsh7uqpq.js",app:"_app/immutable/entry/app.r5ajzoGV.js",imports:["_app/immutable/entry/start.Bsh7uqpq.js","_app/immutable/chunks/CauJ3KTU.js","_app/immutable/chunks/CzLXyedc.js","_app/immutable/chunks/BjmoyH4y.js","_app/immutable/chunks/DO0lw0qQ.js","_app/immutable/entry/app.r5ajzoGV.js","_app/immutable/chunks/CzLXyedc.js","_app/immutable/chunks/DtNZBe1X.js","_app/immutable/chunks/DUDsNDC3.js","_app/immutable/chunks/BjmoyH4y.js","_app/immutable/chunks/BzEENV1F.js","_app/immutable/chunks/CmnUXv2k.js","_app/immutable/chunks/CpYn87mo.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/3.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/place/[id]",
				pattern: /^\/place\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			}
		],
		prerendered_routes: new Set(["/","/settings/"]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
