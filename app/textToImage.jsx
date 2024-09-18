import fs from "node:fs";
import axios from "axios";
import FormData from "form-data";


const payload = {
  prompt: "a surfing cat in a nice blue ocean",
  output_format: "webp"
};

const response = await axios.postForm(
  `https://api.stability.ai/v2beta/stable-image/generate/ultra`,
  axios.toFormData(payload, new FormData()),
  {
    validateStatus: undefined,
    responseType: "arraybuffer",
    headers: { 
      Authorization: `sk-5z64CAFO1IamljfEQS8HoiJdhHFWZWqBzb1xOqDKsIWdf3qL`, 
      Accept: "image/*" 
    },
  },
);

if (response.status === 200) {
   fs.writeFileSync("./lighthouse.webp", Buffer.from(response.data));
} else {
  throw new Error(`${response.status}: ${response.data.toString()}`);
}