// Serves the static proposals site. Every request goes to the asset files.
export default {
  fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};
