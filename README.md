# PML - Philipp's Modern Language

Just another format to specify your configs in\
Currently under development, so don't expect full functionality until version 1.0.0

## Code example

*.js

```js
const pmlParser = require("pml.js").parse_file;
const pmlResult = pmlParser("testFile.pml");
if(!pmlResult.successful)
    console.log(pmlResult.error);
else {
    const result = pmlResult.result;
    if(result.stayAnonymous)
        console.log("I won't tell you anything about me.");
    else
        console.log("Hi, my name is " + result.name + " and I am " + result.age + " years old.");
}
```

testFile.pml

```pml
age=420
first_name = "Max"
name = {first_name} " "{last_name}
last_name = "Mustermann"
stayAnonymous = false

```

Note that you can have strings consist of other values (It wouldn't even have to have been other strings; I could have added the age as part of the name, too!). Numbers and booleans are recognized as such. Spacings between keys, values, the equal sign and the different parts of strings do not matter at all.

## Results

`parse_file()` will return an object containing a boolean `successful` and a regular object containing the actual result.\
If `successful` is `true` this means that there was no error parsing the file and you can find the successfully parsed file in the `result object`.\
Should there have been an error (in which case `successful` is `false`) you can find more info on it in the `error` object.\
An error object contains two values: `type`, a string containing an identifier for the error, and `details`, containing more info on the error. The specifics of `details` depend on the error type.
The following lists all possible error types as well as what `details` includes.

```js
/*
A line of compound strings which at some point loops back to an item already in that list.
Example:
string1 = "s1" {string2}
string2 = {string3}
string3 = {string1} "s3"

Obviously a string cannot contain itself, either:
string4 = "Hello, " {string4}
*/
type: "circular_dependency",
details: // Array containing the keys of the values circularly dependend


/*
A key appears more than once
Example:
key = true
key = false
*/
type: "duplicate_key",
details: {
    key: // The key that appeared a second time
    old_value: // The value the key holds the first time it appears
    new_value: // The value the key holds the second time it appears
}


/*
The specified config file could not be loaded.
*/
type: "file_error",
details: // The error message fs.readFileSync() threw


/*
A compound string did not end properly, that is, the declaration of a literal or variable string was not terminated.
Example:
greeting = "Hello, how are you, " {name
name = "M" "a" "x\"
*/
type: "incomplete_compound_string",
details: {
    key: // The key of the incorrect compound string
    value: // The complete value as specified in the file
    state: // Either "text" or "variable", depending on which of both was not terminated
    state_value: // The literal text or variable name that was not terminated
}


/*
A character other than a space (' '), curly brackets or double quotes was found outside of a variable name or literal string in a compound string.
Example:
example1 = "Hello" "this", "is" "me"
example2 = "My name is " + name
*/
type: "invalid_char_in_compound_string",
details: {
    key: // The key of the compound string
    value: // The complete value as specified in the file
    char: // The illegal character
}


/*
A character not allowed for keys was found where a variable was expected
Example:
part1 = "1"
part2 = "2"
whole = {1 2}
*/
type: "invalid_char_in_compound_string_variable",
details: {
    key: // The key of the compound string
    value: // The complete value as specified in the file
    char: // The illegal character
    prev: // The variable key so far
}


/*
A character other than a digit or '.' was found where a number was expected.
Example:
invalid_number = 324Hello90
*/
type: "invalid_char_in_number",
details: {
    key: // The key of the number
    value: // The complete value as specified in the file
    char: // The illegal character
}


/*
An invalid line was found.
Example:
invalidline1 "This is missing the equal sign"
no_value = 
 = "This is missing a key"
*/
type: "invalid_line",
details: // The complete line


/*
A second decimal point was found in a number.
Example:
invalid_number = 1234.56.78
*/
type: "multiple_decimal_points",
details: {
    key: // The key of the number
    value: // The complete value as specified in the file
}


/*
A compund string depends on a value that does not exist.
Example:
string = "I depend on the non-existent value of " {unmet_dependency}
*/
type: "unmet_dependency",
details: {
    key: // The key of the compound string
    dependency: // The key of the unfulfilled dependency
}
```
