import graphene
import core.schema
import graphql_jwt
from core.schema import Query as CoreQuery, Mutation as CoreMutations

class AuthMutations(graphene.ObjectType):
    token_auth = graphql_jwt.ObtainJSONWebToken.Field()
    verify_token = graphql_jwt.Verify.Field()
    refresh_token = graphql_jwt.Refresh.Field()


class Query(core.schema.Query, graphene.ObjectType):
    pass

class Mutation(core.schema.Mutation, graphene.ObjectType):
    pass

schema = graphene.Schema(query=Query, mutation=Mutation)
