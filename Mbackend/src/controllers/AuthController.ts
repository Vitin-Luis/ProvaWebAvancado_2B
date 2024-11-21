import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { CheckUserPassword, CreateHashPassword } from "../utils/HashPassword";
import { generateJWToken } from "../utils/JWT";

const prisma = new PrismaClient();

class AuthController {
  constructor() {}

  async signIn(req: Request, res: Response){
    try{
        const { email, password } = req.body;

        if(!email || !password){
            return res.json({
                status: 400,
                message: "Email ou senha não informados."
            })
        }

        const user = await prisma.user.findFirst({
            where: {
                email
            }
        })

        if(!user){
            return res.json({
                status: 404,
                message: "Um usuario com este email não existe."
            })
        }
        
        const passwordChecks = await CheckUserPassword(password, user.password)

        if(!passwordChecks){
            return res.json({
                status: 401,
                message: "Senha incorreta."
            })
        }

        const token = await generateJWToken(user)
        return res.json({
            status: 200,
            token: token,
            usuario: user,
            message: "Autenticação bem sucedida."
        })

    }catch(error){
        console.log(error);
        return res.status(500).json({
            error: error
        })
    }
    
    
}
async signUp(req: Request, res: Response) {
  try {
      const userData = req.body;
      const { email, password, confirmPassword } = userData;

      
      if (!email || !password || !confirmPassword) {
          return res.status(400).json({
              status: 400,
              message: "Email, senha ou confirmação de senha não informados."
          });
      }

      
      if (password !== confirmPassword) {
          return res.status(400).json({
              status: 400,
              message: "As senhas não coincidem."
          });
      }

      
      const userExists = await prisma.user.findFirst({
          where: { email }
      });

      if (userExists) {
          return res.status(400).json({
              status: 400,
              message: "Este email já está em uso."
          });
      }

      
      const hashedPassword = await CreateHashPassword(password);
      userData.password = hashedPassword;
      delete userData.confirmPassword;

      await prisma.user.create({
          data: userData
      });

      return res.status(201).json({
          status: 201,
          message: "Usuário criado com sucesso."
      });

  } catch (error) {
      console.log(error);
      return res.status(500).json({
          error: error
      });
  }
}


  async signout() {}
}

export default new AuthController();
