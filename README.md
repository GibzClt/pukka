# pukka ✅

[![version(scoped)](https://img.shields.io/npm/v/pukka.svg)](https://www.npmjs.com/package/pukka)
[![codecov](https://codecov.io/gh/ajaishankar/pukka/graph/badge.svg?token=2O9DD5SEUJ)](https://codecov.io/gh/ajaishankar/pukka)

🪶 Delightfully simple TypeScript validation

## ✨ Why pukka?

| Packs | Power |
|---------|-------------|
| 🪄 **Simple** | Write schemas as plain objects |
| 🎯 **Type Safe** | Full type inference |
| 🧘 **Minimal** | Just 5 functions, that's it! |
| 🔧 **Custom Validation** | Validations done right, your way |
| 📝 **Web Standards** | FormData and URLSearchParams supported out of the box |
| 🛠️ **HTML Form Helper** | Works great with Remix, react-router and Hono apps |
| 🔄 **Smart Types** | Automatic coercion of strings to numbers, booleans and more |
| 🌍 **i18n Ready** | Strongly typed message keys for localization |
| 🛡️ **Reliable** | 100% code coverage, see [index.test.ts](./src/index.test.ts) |
| 🪶 **Tiny** | Just 2kb minified, zero dependencies |

## 📦 Installation

```sh
npm install pukka
```

## 🚀 Basic Usage

Define your schema as a plain object, and add validations

```ts
import { object, validator } from 'pukka'

// define your schema
const schema = object({
  name: "string",
  age: "number",
  "email?": "string",         // optional field
  "username:uname": "string", // field with alias
  hobbies: ["string"],        // array
  address: {                  // nested object
    street: "string",
    city: "string",
    state: "string"
  }
})

// create validator
const validate = validator.for(schema, (data, issues) => {
  if (data.age < 18) {
    issues.age.push("Must be 18 or older");
  }
});

// validate 
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

if (success) {
  // strongly typed data
  console.log(data.name) // string
  console.log(data.age)  // number
  console.log(data.address.street)
} else {
  console.log(errors)
  console.log(data.address?.street) // Street address (if it was entered)
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
form.append("hobbies[0]", "reading") 
form.append("hobbies[1]", "coding")

const { success, data } = validate(form)
```

As with the `qs` package, an arrayLimit can be set for arrays

This is to prevent someone from sending `hobbies[999999999]=cpu-hogging`

```ts
const { success, data } = validate(form, {
  arrayLimit: 100 // default is 50
})
```

## 🛠️ Form Helper

Easily lookup the path, errors and also the submitted value for a field

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

Default error messages can be customized during validation

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

Strongly typed keys for localization

```typescript
const validate = validator.for(schema, (data, issues) => {
  issues.address.street.push(key => i18n.t(key)) // key is "address.street"
  issues.hobbies[0].push(key => i18n.t(key))     // key is "hobbies"
});
```
