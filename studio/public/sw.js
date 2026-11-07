// Development worker: production precaching is generated after vite build.
self.addEventListener('install',()=>{});self.addEventListener('message',e=>{if(e.data?.type==='SKIP_WAITING')self.skipWaiting()});self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
