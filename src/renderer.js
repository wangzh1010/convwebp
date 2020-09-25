import { ipcRenderer } from 'electron';
import Vue from 'vue';
import './index.scss';

new Vue({
    el: '#app',
    data: {
        minSize: 0,
        publicPath: '',
        extensions: ['png', 'jpg'],
        filePaths: [],
        imagePath: '',
        results: {}
    },
    created() {
        let config = localStorage.getItem('DEFAULT_CONFIG');
        if (typeof config === 'string') {
            config = JSON.parse(config);
            this.minSize = config.minSize;
            this.extensions = config.extensions;
            this.publicPath = config.publicPath;
        }
        ipcRenderer.on('PROCESS', (e, filePath, processed) => {
            this.$set(this.results, filePath, processed);
        });
        ipcRenderer.on('INIT', (e, config) => {
            console.log(config)
            this.minSize = config.minSize;
            this.extensions = config.extensions;
            this.publicPath = config.publicPath;
            localStorage.setItem('DEFAULT_CONFIG', JSON.stringify(config));
        });
    },
    mounted() {
        console.log('👋 This message is being logged by "renderer.js", included via webpack');
    },
    methods: {
        chooseFiles() {
            ipcRenderer.invoke('CHOOSE_FILES').then(result => {
                if (result) {
                    this.filePaths = result;
                }
            });
        },
        chooseImages() {
            ipcRenderer.invoke('CHOOSE_IMAGES').then(result => {
                if (result) {
                    this.imagePath = result[0];
                }
            });
        },
        convert() {
            if (!this.publicPath.endsWith('/')) {
                this.publicPath += '/';
            }
            ipcRenderer.send('PROCESS', { minSize: this.minSize, extensions: this.extensions, publicPath: this.publicPath });
        }
    }
})
