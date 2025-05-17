# pukka ✅

[![version(scoped)](https://img.shields.io/npm/v/pukka.svg)](https://www.npmjs.com/package/pukka)
[![codecov](https://codecov.io/gh/ajaishankar/pukka/graph/badge.svg?token=2O9DD5SEUJ)](https://codecov.io/gh/ajaishankar/pukka)

🪶 Delightfully simple TypeScript validation

## ✨ Why pukka?

- 🪄 **Simple**: Write schemas as plain objects
- 🎯 **Type Safe**: Full type inference
- 🪶 **Minimal API**: Tiny footprint - almost nothing new to learn
- 🔧 **Custom Validation**: Validate away, your way
- 📝 **Web Standards**: FormData and URLSearchParams supported out of the box
- 🛠️ **HTML Form Helper**: Render forms with ease, works great with Remix, react-router and Hono apps
- 🔄 **Smart Types**: Automatic coercion of strings to numbers, booleans and more
- 🌍 **i18n Ready**: Strongly typed message keys for internationalization
- 🛡️ **Reliable**: 100% code coverage, see [index.test.ts](./src/index.test.ts)

## 📦 Installation

```sh
npm install pukka
```

## 🚀 Basic Usage

Define your schema as a plain object, and add validations

```ts
import { object, validator } from 'pukka'

// Define your schema
const schema = object({
  name: "string",
  age: "number",
  "email?": "string",         // Optional field
  "username:uname": "string", // Field with alias
  hobbies: ["string"],        // Array
  address: {                  // Nested object
    street: "string",
    city: "string",
    state: "string"
  }
})

// Create validator
const validate = validator.for(schema, (data, issues) => {
  if (data.age < 18) {
    issues.age.push("Must be 18 or older");
  }
});

// Validate 
const { success, data, errors } = validate({
  name: "John",
  age: "25",        // will be coerced to number
  uname: "johndoe", // using alias
  hobbies: ["reading", "coding"],
  address: {
    street: "123 Main St",
    city: "San Francisco",
    state: "CA"
  }
})

if (result.success) {
  // Strongly typed data
  console.log(result.data.name) // string
  console.log(result.data.age)  // number
  console.log(result.data.address.street)
} else {
  console.log(result.errors)
  console.log(result.data.address?.street) // Street address (if it was entered)
}
```

## ⚡ Validation with runtime context

Declare and pass some runtime context to the validator

```ts
type MyContext = {
  states: {
    code: string
    cities: string[]
  }[]
}

const validate = validator.for(
  schema,
  usingContext<MyContext>(), // 🌟 Validator needs this context
  (data, issues, ctx) => {
    const state = ctx.states.find((code) => code === data.state)
    if(!state?.cities.includes(data.city)) {
      issues.city.push(`Invalid city ${data.city}`)
    }
  }
)

const states = await api.getAllStates()

const { success, data } = validate(input, { states })
```

## 📝 FormData validation

Builtin support for FormData and URLSearchParams

```ts
const form = new FormData()

form.append("name", "John")
form.append("address.street", "123 Some St") // 🌟 nested object

// hobbies=reading&hobbies=coding
form.append("hobbies", "reading")
form.append("hobbies", "coding")

// 🌟 indexed array
form.append("hobies[0]", "reading") 
form.append("hobies[1]", "coding")

const { success, data } = validate(form)
```

As with the `qs` package, an arrayLimit can be set for arrays

This is to prevent someone from sending `hobbies[999999999]=cpu-hogging`

```ts
const { success, data } = validate(form, {
  arrayLimit: 100
})
```

The default array limit is 50

## 🛠️ Form Helper

The form helper makes rendering forms a breeze

```tsx
import { form } from 'pukka'

const result = validate(input)

const f = form.helper(result)

<form method="post">
  <input name={f.address.street.path} value={f.address.street.value}>
  <span>{f.address.street.errors[0] ?? ""}</span>
</form>
```

## 💬 Customize Error Messages

Pass a error message function during validation to override default error messages

```ts
const { errors } = validate(input, {
  errorMessage: (key, err) => {
    if (key === "name" && err.code === "required") {
      return "Please enter your full name"
    }
  },
});
```

## 🌍 Internationalization

The key passed to issue is strongly typed and can be used for localization

```typescript
const validate = validator.for(schema, (data, issues) => {
  issues.address.street.push(key => i18n.t(key)) // key is "address.street"
  issues.hobbies[0].push(key => i18n.t(key)) // key is "hobbies"
});
```
