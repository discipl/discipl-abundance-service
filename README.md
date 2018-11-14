# discipl-abundance-service

lightweight api for abundance services

This small API can be used on top of the discipl core API. It enables self sovereign entities to communicate needs and 
offer of (free abundance) services that attend to those needs. Typically one would start to do this in an anonymous way in public 
and if an initial match of need and offer is established, a universal transaction (as in DEMO modelling) can be done
in a p2p setting, and if neccasary by referral to other communication platforms supported by the Discipl Core API (which can
be pretty much any platform).

The API enforces the creation of a new self sovereign id for each need and service attending to needs on a given platform. 
The argument what is needed or attended to is expected to follow / refer to a datastructure that is using DSL in 
a new UETP standard, standardizing how to express a What, How, When, Whom etc in a universal way, but is expected to be any 
string for now. For now, a need and service attending to it will have to denote the exact same string here to ensure the entities
can find each other. It is expected this could be improved with obvious techniques like word distance, automatic translations 
or AI. The idea is that needs and services attending to them can be denoted on different platforms and still be able to find each 
other. This is limited to the platforms that are supported in the discipl node used.

The way it works is this:

1. a service attending to need 'X' is declared on a specific platform supported by discipl core and a ssid is created for this
2. this service subscribes on events in which the 'X' gets known to be needed by other entities.
3. an entity declares a need for 'X' on a specific platform suported by discipl core and a ssid is created for this
4. this entity subscribes on events in which a service that attends to X attests the need (through match(), which creates a new ssid, 
   just for handling this need, links to the original service and attests the need)
5. through the discipl core API, the entity in need and the service attending to it can start a conversation, 
   both on their respective platform in relation to their ssid following each other using the subscribe method of the discipl core API
6. within the conversation in step 5, both parties can choose to continue (in parallel) under a different ssid on a different platform. 
   This will be needed when getting into detail, or enforcing requirements about what exactly is wanted, where, how etc. You will not want to do all this 
   in public as it cold contain more private information. This is done by referring to a new did (public part of a ssid) and could
   be done more than once.
7. within the conversation in step 5, one would follow the universal transation pattern (as in DEMO modelling) but this API
   only prescribes the use of match() and solved(), the latter denoting that the need has been solved which
   should be done by the entity in need of course.

So the API becomes:

ssidNeed = need(platform, what)
ssidAttendTo = attendTo(platform, what)
serviceInfo(ssid, info)
subscribe(ssid)
match(ssid, did)
solved(ssidNeed, didService)
referTo(ssidReferrer, ssidReferred)

The serviceInfo method is just a method to denote extra information about how the service attends to the need, what it can
offer, limitations etc.

In relation to this API, the discipl-4sacan API can add permissions and requirements on what ssid's will be allowed and 
found instead of ignored through the subscribe method. The discipl-law-reg enables services to be defined and put into existence
based on laws and regulations through FLINT-LD. The discipl-pattern API will include support for escalating unmet needs or conflicting 
needs to Convergent Facilitation processes.

Entities are anonymous until required otherwise in which case these requirements could be verified to be met through
the discipl core API. In this case, attestations of third parties come into play, but they wil not be able to follow
which attestations were used to proof requirements. The usage of discipl-4sacan will enable you to keep private, though
in addition to this, entities will have to make sure not to leak private information on public platforms. Entities that get 
private information shared will have to abide to GDPR and will have to identify themselves too.

