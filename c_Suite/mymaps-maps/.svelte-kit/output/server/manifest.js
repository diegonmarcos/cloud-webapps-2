export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "maps/_app",
	assets: new Set(["favicon.png"]),
	mimeTypes: {".png":"image/png"},
	_: {
		client: {start:"_app/immutable/entry/start.CNH9mKvg.js",app:"_app/immutable/entry/app.CGzKJ2Ni.js",imports:["_app/immutable/entry/start.CNH9mKvg.js","_app/immutable/chunks/D5XxWMzz.js","_app/immutable/chunks/9tA0VgWr.js","_app/immutable/chunks/w1L-M-CB.js","_app/immutable/chunks/D8NgZCny.js","_app/immutable/entry/app.CGzKJ2Ni.js","_app/immutable/chunks/9tA0VgWr.js","_app/immutable/chunks/Ce0DvZ6j.js","_app/immutable/chunks/4ilQHsh4.js","_app/immutable/chunks/w1L-M-CB.js","_app/immutable/chunks/BHI7KTVC.js","_app/immutable/chunks/BgY-Dzwj.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js'))
		],
		remotes: {
			
		},
		routes: [
			
		],
		prerendered_routes: new Set(["/maps/"]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
