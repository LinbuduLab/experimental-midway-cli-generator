import { Field, ID, ObjectType } from "type-graphql";

@ObjectType()
export class Xxx {
  @Field((type) => ID)
  id: number;

  @Field()
  name: string;
}
