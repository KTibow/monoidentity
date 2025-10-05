import { fn } from "monoserve";
import { string } from "valibot";
import { encodeBucket } from "../sdk/src/lib/utils-bucket";

export default fn(string(), () => {
  // todo fix this
  return encodeBucket({});
});
