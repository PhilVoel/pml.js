import { readFileSync } from 'fs';

export function parse_file(file_name) {
	try {
		return parse_lines(readFileSync(file_name, 'utf8').split('\n'));
	} catch (error) {
		return {
			successful: false,
			error: {
				type: "file_error",
				details: error
			}
		}
	}
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
		else if(converted_value.string) {
			incomplete_strings.push({
				key: key,
				inc_str: converted_value.array
			});
		}
		else {
			result[key] = converted_value.result;
		}
	}
	for(let i=0; i<incomplete_strings.length; i++) {
		let names = [incomplete_strings[i].key];
		let dependencies = incomplete_strings[i].inc_str.filter(inc_str => inc_str.type == "variable").map(inc_str => inc_str.value);
		outer:
		for(let j=0; j<dependencies.length; j++) {
			if(result[dependencies[j]] === undefined) {
				for(let k=0; k<incomplete_strings.length; k++) {
					if (incomplete_strings[k].key == dependencies[j])
						continue outer;
				}
				return {
					successful: false,
					error: {
						type: "unmet_dependency",
						details: {
							key: incomplete_strings[i].key,
							dependency: dependencies[j]
						}
					}
				}
			}
		}
		if(check_circular_dependencies(names, dependencies, incomplete_strings))
			return {
				successful: false,
				error: {
					type: "circular_dependency",
					details: names
				}
			}
	}
	while(incomplete_strings.length > 0) {
		let incomplete_strings2 = [];
		for(let i=0; i<incomplete_strings.length; i++) {
			const key = incomplete_strings[i].key;
			const inc_str = incomplete_strings[i].inc_str;
			let accum_str = "";
			let split = [];
			for(let j=0; j<inc_str.length; j++) {
				let value = inc_str[j].value;
				if(inc_str[j].type == "text")
					accum_str += value;
				else if(result[value] !== undefined)
					accum_str += result[value];
				else {
					split.push({
						value: accum_str,
						type: "text"
					});
					accum_str = "";
					split.push({
						value: value,
						type: "variable"
					});
				}
			}
			if(split.length == 0) {
				result[key] = accum_str;
			}
			else {
				split.push({
					value: accum_str,
					type: "text"
				});
				incomplete_strings2.push({
					key: key,
					inc_str: split
				});
			}
		}
		incomplete_strings = incomplete_strings2;
	}
	return {
		successful: true,
		result: result
	}
}

function convert_value(value, key) {
	if(value.startsWith('"') || value.startsWith('{') && value.endsWith('"') || value.endsWith('}')) {
		value.replace("\\\"", "\"");
		value.replace("\\\n", "\n");
		let to_insert = "";
		let state = "none";
		let split = [];
		for(let i=0; i<value.length; i++) {
			const c = value[i];
			if(state == "none") {
				switch(c) {
					case '"':
						state = "text";
						break;
					case '{':
						state = "variable";
						break;
					case ' ':
						break;
					default:
						return {
							successful: false,
							error: {
								type: "invalid_char_in_compound_string",
								details: {
									key: key,
									value: value,
									char: c
								}
							}
						}
				}
			}
			else if(state == "text") {
				if(c == '"' && !to_insert.endsWith("\\")) {
					state = "none";
					split.push({
						value: to_insert,
						type: "text"
					});
					to_insert = "";
				}
				else {
					to_insert += c;
				}
			}
			else if(state == "variable") {
				switch(c) {
					case '}':
						state = "none";
						if(to_insert != "") {
							split.push({
								value: to_insert,
								type: "variable"
							});
							to_insert = "";
						}
						break;
					case ' ':
						return {
							successful: false,
							error: {
								type: "invalid_char_in_compound_string_variable",
								details: {
									key: key,
									value: value,
									char: c,
									prev: to_insert
								}
							}
						}
					default:
						to_insert += c;
				}
			}
		}
		if(state != "none") {
			return {
				successful: false,
				error: {
					type: "incomplete_compound_string",
					details: {
						key: key,
						value: value,
						state: state,
						state_value: to_insert
					}
				}
			}
		}
		return {
			successful: true,
			array: split,
			string: true
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

function check_circular_dependencies(names, dependencies, incomplete_strings) {
	for(let i=0; i<dependencies.length; i++) {
		if (names.includes(dependencies[i]))
			return true;
		for(let j=0; j<incomplete_strings.length; j++) {
			if(incomplete_strings[j].key == dependencies[i]) {
				names.push(incomplete_strings[j].key);
				let dependencies = incomplete_strings[j].inc_str.filter(inc_str => inc_str.type == "variable").map(inc_str => inc_str.value);
				if(check_circular_dependencies(names, dependencies, incomplete_strings))
					return true;
			}
		}
	}
	return false;
}
