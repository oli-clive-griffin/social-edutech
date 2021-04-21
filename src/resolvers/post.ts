import { Post } from "../entities/Post";
import { MyContext } from "../types";
import { Resolver, Mutation, Query, Ctx, Arg } from "type-graphql";


@Resolver()
export class PostResolver {

  @Query(() => [Post])
  posts(@Ctx() { em }: MyContext): Promise<Post[]> {
    return em.find(Post, {})  
  }
  
  @Query(() => Post, {nullable: true})
  post(
    @Arg("id") id: number,
    @Ctx() { em }: MyContext
  ): Promise<Post | null> {
    return em.findOne(Post, { id })
  }

  @Mutation(() => Post)
  async createPost(
    @Arg("title") title: string,
    @Ctx() { em }: MyContext
  ): Promise<Post> {
    const post = em.create(Post, { title, secret_property: "this is a secret"})
    await em.persistAndFlush(post)
    return post
  }

  @Mutation(() => Post)
  async updatePost(
    @Arg("id") id: number,
    @Arg("title") title: string,
    @Ctx() { em }: MyContext
  ): Promise<Post | null> {
    const post = await em.findOne(Post, {id})
    if (!post) {
      return null
    }
    if (typeof post !== "undefined") {
      post.title = title
      await em.persistAndFlush(post)
    }
    return post
  }

  @Mutation(() => Boolean)
  async deletePost(
    @Arg("id") id: number, 
    @Ctx() { em }: MyContext
  ): Promise<boolean> {
    await em.nativeDelete(Post, {id})
    return true
  }
}
