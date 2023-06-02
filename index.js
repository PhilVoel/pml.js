const fs = require('fs');

exports.parse_file = function(file_name) {
	return parse_lines(fs.readFileSync(file_name, 'utf8').split('\n'));
}

function parse_lines(lines) {
	let result = {};
	let incomplete_strings = [];
	for(let i=0; i<lines.length; i++) {
		const line = lines[i];
		if(line.trim() == "")
			continue;
		const split_line = line.split('=', 2);
		const key = split_line[0].trim();
		const value = split_line[1].trim();
		console.log(key, value);
		if(key == "" || value == "") {
			return {
				successful: false,
				error: {
					type: "invalid_line",
					details: line
				}
			}
		}
		if(result[key] !== undefined) {
			return {
				successful: false,
				error: {
					type: "duplicate_key",
					details: {
						key: key,
						old_value: result[key],
						new_value: value
					}
				}
			}
		}
		const converted_value = convert_value(value, key);
		if(!converted_value.successful) {
			return converted_value;
		}
		else if(converted_value.incomplete) {
			incomplete_strings.push({
				key: key,
				value: converted_value.result
			});
		}
		else {
			result[key] = converted_value.result;
		}
	}
	//TODO Imcomplete strings + check circular dependencies
	return {
		successful: true,
		result: result
	}
}

function convert_value(value, key) {
	if(value.startsWith('"') || value.startsWith('{') && value.endsWith('"') || value.endsWith('}')) {
		//TODO string evaluation
		return {
			successful: false,
			error: {
				type: "srings_not_yet_supported",
				details: {
					key: key,
					value: value
				}
			}
		}
	}
	else if(value == "true") {
		return {
			successful: true,
			result: true
		}
	}
	else if(value == "false") {
		return {
			successful: true,
			result: false
		}
	}
	else {
		const backup = value;
		if(value.startsWith("("))
			value = value.split(")", 2)[1].trim();
		let error = false;
		let float = false;
		for(let i=0; i<value.length; i++) {
			const char = value[i];
			if(char == "." && !float)
				float = true;
			else if(char == "." && float)
				return {
					successful: false,
					error: {
						type: "multiple_decimal_points",
						details: {
							key: key,
							value: backup
						}
					}
				}
			else if(!(char in "0123456789".split("")))
				return {
					successful: false,
					error: {
						type: "invalid_char_in_number",
						details: {
							char: char,
							key: key,
							value: backup
						}
					}
				}
		}
		if(float) {
			return {
				successful: true,
				result: parseFloat(value)
			}
		}
		else {
			return {
				successful: true,
				result: parseInt(value)
			}
		}
	}
}
