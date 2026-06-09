// const nodemailer = require("nodemailer")

// const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST,
//   port: process.env.EMAIL_PORT,
//   secure: false,
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   }
// })

// const sendVerificationEmail = async (email, token) => {
//   const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`

//   await transporter.sendMail({
//     from: process.env.EMAIL_USER,
//     to: email,
//     subject: "Verify Your Email",
//     html: `
//       <h2>Email Verification</h2>
//       <p>Click the button below to verify your email:</p>
//       <a href="${verificationUrl}">
//         <button>Verify Email</button>
//       </a>
//     `
//   })
// }

// module.exports = sendVerificationEmail;