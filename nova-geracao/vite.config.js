import {defineConfig} from 'vite';
import {viteSingleFile} from 'vite-plugin-singlefile';

// Empacotamento de laboratório: um HTML real com Phaser embutido para abrir
// diretamente no Chrome do Android, mesmo sob file:// ou content://.
export default defineConfig({
 base:'./',
 plugins:[viteSingleFile({removeViteModuleLoader:true})],
 build:{outDir:'dist',emptyOutDir:true,assetsInlineLimit:100000000,cssCodeSplit:false,rollupOptions:{output:{manualChunks:undefined}}}
});
