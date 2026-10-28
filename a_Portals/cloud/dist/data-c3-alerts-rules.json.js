// GENERATED FROM c3-alerts-rules.json by front-data-json-js-wrapper.sh — DO NOT EDIT BY HAND.
// Re-generate with: bash Lnktree/linktree/src/data/build.sh
(function () {
  var g = (typeof globalThis !== "undefined") ? globalThis : (typeof window !== "undefined" ? window : this);
  g.PORTAL_DATA = g.PORTAL_DATA || {};
  g.PORTAL_DATA["c3-alerts-rules"] = [
  {
    "id": 1,
    "name": "high-cpu-oci-apps",
    "target": "oci-apps",
    "metric": "cpu",
    "op": "gt",
    "threshold": 85,
    "forSeconds": 120,
    "enabled": true
  },
  {
    "id": 3,
    "name": "cpu-spike-any",
    "target": "oci-apps",
    "metric": "cpu",
    "op": "gte",
    "threshold": 90,
    "forSeconds": 60,
    "enabled": true
  },
  {
    "id": 7,
    "name": "disk-nearly-full",
    "target": "gcp-mesh",
    "metric": "disk",
    "op": "gt",
    "threshold": 85,
    "forSeconds": 300,
    "enabled": true
  }
]
;
})();
