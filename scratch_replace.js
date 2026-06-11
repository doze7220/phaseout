const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInDir(fullPath);
        } else if (fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;
            content = content.replace(/LAYOUT_CONFIG\.APP_WIDTH/g, 'LAYOUT_CONFIG.BASE.WIDTH');
            content = content.replace(/LAYOUT_CONFIG\.APP_HEIGHT/g, 'LAYOUT_CONFIG.BASE.HEIGHT');
            content = content.replace(/LAYOUT_CONFIG\.HEADER_HEIGHT/g, 'LAYOUT_CONFIG.BASE.HEADER_HEIGHT');
            content = content.replace(/LAYOUT_CONFIG\.FOOTER_HEIGHT/g, 'LAYOUT_CONFIG.BASE.FOOTER_HEIGHT');
            content = content.replace(/LAYOUT_CONFIG\.INITIAL_GEM_COUNT/g, 'LAYOUT_CONFIG.BASE.INITIAL_GEM_COUNT');
            if (content !== original) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Updated: ' + fullPath);
            }
        }
    }
}

replaceInDir('D:/ozlab/phaseout/js');
