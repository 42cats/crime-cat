function delimiterGeter(str) {
    // `_` 기준으로 첫 번째 부분과 나머지 부분을 나누기
    const [part1, rest] = str.split('_');

    let part2a = '';
    let part3a = '';
    let part4 = '';
    console.log("rest type ", typeof rest , rest, str);
    // `:`가 있을 경우 rest를 `:` 기준으로 나누기
    if (rest.includes(':')) {
        [part2a, part3a] = rest.split(':');
    } else {
        part2a = rest; // :가 없으면 rest를 그대로 part2a에 할당
    }

    // `?`가 있을 경우 part3a를 `?` 기준으로 나누기
    if (part3a.includes('?')) {
        [part3a, part4] = part3a.split('?');
    } else {
        part4 = part3a; // ?가 없으면 part3a를 그대로 part4에 할당
    }

    return {
        "head": part1,
        "command": part2a,
        "option": part3a,
        "otherOption": part4
    };
}

module.exports = delimiterGeter;
