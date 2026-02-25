export function buildSdkSnippet(siteId: string) {
  return `<script>
(function(){
  var script = document.createElement('script');
  script.src = 'https://cdn.pulsepress.dev/pulsepress-sdk.js';
  script.defer = true;
  script.dataset.siteId = '${siteId}';
  document.head.appendChild(script);
})();
</script>`;
}
