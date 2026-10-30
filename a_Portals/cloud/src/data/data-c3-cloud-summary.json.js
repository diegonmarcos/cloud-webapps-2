// GENERATED FROM c3-cloud-summary.json by front-data-json-js-wrapper.sh — DO NOT EDIT BY HAND.
// Re-generate with: bash a_Portals/linktree/src/data/build.sh
(function () {
  var g = (typeof globalThis !== "undefined") ? globalThis : (typeof window !== "undefined" ? window : this);
  g.PORTAL_DATA = g.PORTAL_DATA || {};
  g.PORTAL_DATA["c3-cloud-summary"] = {
  "oci": {
    "instances": [
      {
        "id": "oci-mail",
        "shape": "VM.Standard.E2.1.Micro",
        "state": "RUNNING"
      },
      {
        "id": "oci-analytics",
        "shape": "VM.Standard.E2.1.Micro",
        "state": "RUNNING"
      },
      {
        "id": "oci-apps",
        "shape": "VM.Standard.A1.Flex",
        "state": "RUNNING"
      }
    ],
    "resources": {
      "count": 3
    },
    "costs": {
      "monthly_usd": 0.0,
      "note": "Always Free tier"
    }
  },
  "gcp": {
    "instances": [
      {
        "id": "gcp-f-micro_1",
        "machineType": "e2-micro",
        "state": "RUNNING"
      }
    ],
    "resources": {
      "count": 1
    },
    "costs": {
      "monthly_usd": 0.0,
      "note": "Free tier e2-micro"
    }
  }
};
})();
