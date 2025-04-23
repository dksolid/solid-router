// eslint-disable-next-line @typescript-eslint/naming-convention
function Error(props: { errorCode: number }) {
  return `Error ${props.errorCode}`;
}

// eslint-disable-next-line import/no-default-export
export default Error;
