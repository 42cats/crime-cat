const fs = require('fs');
const path = require('path');

const BASE_DIR = '/Users/byeonsanghun/goinfre/crime-cat/bot/Commands/api';

function updateFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');

    // console.log() 및 console.error() 대체
    let updatedContent = content
        .replace(/console\.log\(/g, 'logger.info(')
        .replace(/console\.error\(/g, 'logger.error(');

    // 로거 import 추가 (중복 방지)
    if (!content.includes('const logger = require(')) {
        const importLine = "const logger = require('../../utility/logger');\n";
        updatedContent = importLine + updatedContent;
    }

    // 에러 처리 로직 개선
    updatedContent = updatedContent.replace(
        /error\.response\?\.\data \|\| error\.response\?\.\data\?\.message/g, 
        'logger.formatApiError(error)'
    );

    fs.writeFileSync(filePath, updatedContent, 'utf8');
    console.log(`Updated: ${filePath}`);
}

function traverseDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            traverseDirectory(fullPath);
        } else if (file.endsWith('.js')) {
            updateFile(fullPath);
        }
    });
}

traverseDirectory(BASE_DIR);
console.log('Logger 업데이트 완료!');