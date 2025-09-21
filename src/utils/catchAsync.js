// Wrapper para manejar errores async/await
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next)
  }
}

export default catchAsync