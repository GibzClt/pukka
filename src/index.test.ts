import { describe, expect, expectTypeOf, it, test } from "vitest";
import { form, object, usingContext, validator } from "./index";

const schema = object({
  string: "string",
  number: "number",
  boolean: "boolean",
  file: "file",
  bigint: "bigint",
  array: ["string"],
  object: {
    a: "number",
    b: {
      c: "string",
      d: [{ e: "string" }],
    },
  },
  "optional?": "number",
  "alias:aka": "string",
});

const input = {
  string: "string",
  number: 1,
  boolean: true,
  file: new File([], "a.txt"),
  bigint: 1n,
  array: ["a", "b", "c"],
  object: {
    a: 1,
    b: {
      c: "c",
      d: [{ e: "e" }],
    },
  },
  aka: "jdoe",
};

const formdata = new FormData();

formdata.append("string", "string");
formdata.append("number", "1");
formdata.append("boolean", "true");
formdata.append("file", new File([], "a.txt"));
formdata.append("bigint", "1");
formdata.append("array", "a");
formdata.append("array", "b");
formdata.append("array", "c");
formdata.append("object.a", "1");
formdata.append("object.b.c", "c");
formdata.append("object.b.d[0].e", "e");
formdata.append("aka", "jdoe");

const urlSearchParams = new URLSearchParams([
  ["string", "string"],
  ["number", "1"],
  ["boolean", "true"],
  ["bigint", "1"],
  ["array", "a"],
  ["array", "b"],
  ["array", "c"],
  ["object.a", "1"],
  ["object.b.c", "c"],
  ["object.b.d[0].e", "e"],
  ["aka", "jdoe"],
]);

const invalid = {
  number: {},
  boolean: "b",
  array: [undefined, null],
  object: {
    a: "a",
    b: {
      d: [null, {}],
    },
  },
};

type SomeRuntimeCtx = {
  allowedStrings: string[];
};

const validate = validator.for(schema);

const validateWithCtx = validator.for(
  schema,
  usingContext<SomeRuntimeCtx>(),
  (data, issues, ctx) => {
    const str = data.string;
    if (!ctx.allowedStrings.includes(str)) {
      issues.string.push(`Expecting one of ${ctx.allowedStrings}`);
    }
  },
);

test("validate", () => {
  const { success, data, errors } = validate({ ...input, extra: true });

  const { aka, ...rest } = input;

  expect(success).toBe(true);
  expect(data).toStrictEqual({ ...rest, optional: undefined, alias: "jdoe" });
  expect(errors).toEqual({});
});

test("validate form data", () => {
  const { success, data, errors } = validate(formdata);

  const { aka, ...rest } = input;

  expect(success).toBe(true);
  expect(data).toStrictEqual({ ...rest, optional: undefined, alias: "jdoe" });
  expect(errors).toEqual({});
});

test("validate url search params", () => {
  const { file, ...query } = schema;
  const validate = validator.for(query);

  const { success, data, errors } = validate(urlSearchParams);

  const { aka, file: _, ...rest } = input;

  expect(success).toBe(true);
  expect(data).toStrictEqual({ ...rest, optional: undefined, alias: "jdoe" });
  expect(errors).toEqual({});
});

test("validate with runtime context", () => {
  const { success, data, errors } = validateWithCtx(input, {
    allowedStrings: ["foo", "bar"],
  });

  const { aka, ...rest } = input;

  expect(success).toBe(false);
  expect(data).toStrictEqual({ ...rest, optional: undefined, alias: "jdoe" });
  expect(errors).toEqual({
    string: { value: "string", errors: ["Expecting one of foo,bar"] },
  });
});

test("data type on success matches schema", () => {
  type SuccessData = {
    string: string;
    number: number;
    boolean: boolean;
    file: File;
    bigint: bigint;
    array: string[];
    object: {
      a: number;
      b: {
        c: string;
        d: { e: string }[];
      };
    };
    alias: string;
    optional: number | undefined;
  };

  const { success, data } = validate(input);

  if (success) {
    expectTypeOf(data).toEqualTypeOf<SuccessData>();
  }
});

test("data type on error has all schema fields optional", () => {
  type B = {
    c: string | undefined;
    d: ({ e: string | undefined } | undefined)[] | undefined;
  };

  type O = {
    a: number | undefined;
    b: B | undefined;
  };

  type ErrorData = {
    string: string | undefined;
    number: number | undefined;
    boolean: boolean | undefined;
    file: File | undefined;
    bigint: bigint | undefined;
    array: (string | undefined)[] | undefined;
    object: O | undefined;
    alias: string | undefined;
    optional: number | undefined;
  };

  const { success, data } = validate(input);

  if (success === false) {
    expectTypeOf(data).toEqualTypeOf<ErrorData>();
  }
});

describe("errors", () => {
  it("should return failure", () => {
    const { success } = validate({ ...invalid, extra: true });
    expect(success).toBe(false);
  });

  it("should return data with expected shape", () => {
    const { data } = validate({ ...invalid, extra: true });

    expect(data).toStrictEqual({
      string: undefined,
      array: [undefined, null],
      bigint: undefined,
      boolean: undefined,
      file: undefined,
      number: undefined,
      object: {
        a: undefined,
        b: {
          c: undefined,
          d: [null, { e: undefined }],
        },
      },
      optional: undefined,
      alias: undefined,
    });
  });

  it("should return errors", () => {
    const { errors } = validate({ ...invalid, extra: true });

    expect(errors).toEqual({
      string: {
        value: "",
        errors: ["String is required"],
      },
      number: {
        value: "",
        errors: ["Expected 'number', received 'object'"],
      },
      boolean: {
        value: "b",
        errors: ["Expected 'boolean', received 'b'"],
      },
      file: {
        value: "",
        errors: ["File is required"],
      },
      bigint: {
        value: "",
        errors: ["Bigint is required"],
      },
      alias: {
        value: "",
        errors: ["Alias is required"],
      },
      "array[0]": {
        value: "",
        errors: ["Array is required"],
      },
      "array[1]": {
        value: "",
        errors: ["Array is required"],
      },
      "object.a": {
        value: "a",
        errors: ["Expected 'number', received 'a'"],
      },
      "object.b.c": {
        value: "",
        errors: ["C is required"],
      },
      "object.b.d[0]": {
        value: "",
        errors: ["D is required"],
      },
      "object.b.d[1].e": {
        value: "",
        errors: ["E is required"],
      },
    });
  });

  test("can override errors", () => {
    const { errors } = validate(
      { ...invalid, extra: true },
      {
        errorMessage(key, err) {
          return `${key}: ${err.code} error`;
        },
      },
    );
    expect(errors).toEqual({
      string: { value: "", errors: ["string: required error"] },
      number: { value: "", errors: ["number: type error"] },
      boolean: { value: "b", errors: ["boolean: type error"] },
      file: { value: "", errors: ["file: required error"] },
      bigint: { value: "", errors: ["bigint: required error"] },
      alias: { value: "", errors: ["alias: required error"] },
      "array[0]": { value: "", errors: ["array: required error"] },
      "array[1]": { value: "", errors: ["array: required error"] },
      "object.a": { value: "a", errors: ["object.a: type error"] },
      "object.b.c": { value: "", errors: ["object.b.c: required error"] },
      "object.b.d[0]": { value: "", errors: ["object.b.d: required error"] },
      "object.b.d[1].e": {
        value: "",
        errors: ["object.b.d.e: required error"],
      },
    });
  });
});

test("form helper", () => {
  const result = validate(invalid);

  const f = form.helper(result);

  expect(f.boolean.path).toBe("boolean");
  expect(f.boolean.value).toBe("b");
  expect(f.boolean.errors).toEqual(["Expected 'boolean', received 'b'"]);

  expect(f.object.b.d.path).toBe("object.b.d");
  expect(f.object.b.d.errors).toEqual({});
  expect(f.object.b.d.length).toBe(2);

  const b = f.object.b;
  let index = -1;
  for (const item of b.d) {
    ++index;
    if (index === 0) {
      expect(item.path).toBe("object.b.d[0]");
      expect(item.errors).toEqual(["D is required"]);
    } else {
      expect(item.path).toBe("object.b.d[1]");
      expect(item.errors).toEqual({});
      expect(item.e.path).toBe("object.b.d[1].e");
      expect(item.e.errors).toEqual(["E is required"]);
    }
  }
});

describe("callback", () => {
  const input = {
    object: {
      b: {
        d: [null],
      },
    },
  };

  it("should pass null safe object to callback", () => {
    let callbackData = undefined as unknown;

    const validate = validator.for(schema, (data) => {
      callbackData = data;
    });

    validate(input);

    expect(callbackData).toMatchObject({
      string: "",
      number: 0,
      boolean: false,
      bigint: 0n,
      array: [],
      object: {
        a: 0,
        b: {
          c: "",
          d: [{ e: "" }],
        },
      },
    });

    expect((callbackData as any).file).toBeInstanceOf(File);
  });

  test("callback can perform additional validations", () => {
    const validate = validator.for(schema, (data, issues) => {
      if (data.object.b.d[0].e === "") {
        issues.object.b.d[0].e.push("string cannot be empty");
        issues.object.b.d[0].e.push(
          (key) => `translated error for key '${key}'`,
        );
      }
    });

    const { errors } = validate(input);

    expect(errors["object.b.d[0].e"].errors).toEqual([
      "string cannot be empty",
      "translated error for key 'object.b.d.e'",
    ]);
  });

  it("should catch exception in callback and return root error", () => {
    const validate = validator.for(schema, () => {
      throw new Error("callback error");
    });

    const { errors } = validate(input);

    expect(errors[""]).toEqual({
      value: "",
      errors: ["Exception: callback error"],
    });
  });

  it("can override exception message", () => {
    const validate = validator.for(schema, () => {
      throw new Error("callback error");
    });

    const { errors } = validate(input, {
      errorMessage: (key, err) => {
        if (key === "" && err.code === "exception") {
          return "An error occurred";
        }
      },
    });

    expect(errors[""]).toEqual({
      value: "",
      errors: ["An error occurred"],
    });
  });
});

describe("array limit", () => {
  it("default array limit", () => {
    const { success, data, errors } = validate({
      array: Array(51).fill("a"),
    });
    expect(success).toBe(false);
    expect(data.array).toEqual([]);
    expect(errors.array.errors[0]).toEqual(
      "Array length 51 is greater than limit 50",
    );
  });

  it("can force array limit", () => {
    const { success, data, errors } = validate(input, {
      arrayLimit: 2,
    });
    expect(success).toBe(false);
    expect(data.array).toEqual([]);
    expect(errors.array.errors[0]).toEqual(
      "Array length 3 is greater than limit 2",
    );
  });
  it("can override limit message", () => {
    const { errors } = validate(input, {
      arrayLimit: 2,
      errorMessage: (key) => "too many items",
    });
    expect(errors.array.errors[0]).toEqual("too many items");
  });
});

describe("coerce", () => {
  it("should convert single item to array", () => {
    const { data } = validate({ array: "a" });
    expect(data.array).toEqual(["a"]);
  });

  it("should convert null and undefined to empty array", () => {
    const { data } = validate({
      array: undefined,
      object: { b: { d: null } },
    });
    expect(data.array).toStrictEqual([]);
    expect(data.object?.b?.d).toStrictEqual([]);
  });

  it("should not try to coerce to object", () => {
    const { data } = validate({ object: "a" });
    expect(data.object).toBe(undefined);
  });

  it("should convert to string", () => {
    const { data } = validate({ string: 1 });
    expect(data.string).toBe("1");
  });

  it("should convert to boolean", () => {
    for (const value of ["true", "1", 1]) {
      const { data } = validate({ boolean: value });
      expect(data.boolean).toBe(true);
    }
    for (const value of ["false", "0", 0]) {
      const { data } = validate({ boolean: value });
      expect(data.boolean).toBe(false);
    }
  });

  it("should try coerce to bigint", () => {
    const { data } = validate({ bigint: "1" });
    expect(data.bigint).toBe(1n);

    const { data: data2 } = validate({ bigint: "a" });
    expect(data2.bigint).toBe(undefined);
  });

  it("cannot convert to file", () => {
    const { data } = validate({ file: "f" });
    expect(data.file).toBe(undefined);
  });
});

test.each([
  [null, "null"],
  [undefined, "undefined"],
  [[], "array"],
  [new (class Foo {})(), "Foo"],
])("validate with bad source (%o)", (input, received) => {
  const { success, errors } = validate(input);
  expect(success).toBe(false);
  expect(errors).toEqual({
    "": {
      value: "",
      errors: [`Expected 'object', received '${received}'`],
    },
  });
});
