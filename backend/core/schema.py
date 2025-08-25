import graphene
from .queries import Query as CoreQuery, UserType
from .mutations import Mutation as CoreMutation

class Query(CoreQuery, graphene.ObjectType):
    me = graphene.Field(UserType)
    def resolve_me(self, info):
        user = info.context.user
        return user if user.is_authenticated else None
    
class Mutation(CoreMutation, graphene.ObjectType):
    pass

# schema = graphene.Schema(query=Query, mutation=Mutation)