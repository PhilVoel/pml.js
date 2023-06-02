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
