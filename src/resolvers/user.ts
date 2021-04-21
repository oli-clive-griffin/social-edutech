import { User } from "../entities/User";
import { MyContext } from "../types";
import { Resolver, Mutation, Query, Ctx, Arg, InputType, Field, ObjectType} from "type-graphql";
import argon2 from 'argon2'

@InputType()
class UsernamePasswordInput {
  @Field()
  username: string
  @Field()
  password: string
}

@ObjectType()
class FieldError {
  @Field()
  field: string
  @Field()
  message: string
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], {nullable: true})
  errors?: FieldError[]

  @Field(() => User, {nullable: true})
  user?: User
}

@Resolver()
export class UserResolver {

  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { em }: MyContext
  ) {
    if (options.username.length <= 2) {
      return {
        errors: [{
          field: "username",
          message: "username too short, length must be greater than 2"
        }]
      }
    }
    if (options.password.length <= 3) {
      return {
        errors: [{
          field: "username",
          message: "password too short, length must be greater than 3"
        }]
      }
    }
    const hashedPassword = await argon2.hash(options.password)
    const user = em.create(User, {
        username: options.username,
        password: hashedPassword
      })
    try {
      await em.persistAndFlush(user)
    } catch (e) {
      // duplicate username error
      if (e.code === 23505 || e.detail.includes("already exists")) {
        return {
          errors: [{
            field: "username",
            message: "Username is taken"
          }]
        }
      }

      console.error(e.message)
    }
    return { user }
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { em }: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(User, { username: options.username })
    if (!user) {
      console.log("username err");
      return {
        errors: [
          {
            field: "username",
            message: "that username doesn't exist"
          },
        ],
      }
    }

    console.log(user);
    
    const valid = await argon2.verify(user.password, options.password)

    if(!valid) {
      console.log("pass err");
      return {
        errors: [
          {
            field: "password",
            message: "incorrect password"
          }
        ]
      }
    }

    return {
      user
    }
  }

  @Query(() => [User])
  async users(@Ctx() { em }: MyContext) {
    const users = em.find(User, {})
    return users
  }
}