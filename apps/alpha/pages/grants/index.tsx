import { gql, useMutation, useQuery } from "@apollo/client";
import {
  GrantsContext,
  GrantsModal,
  GrantsProvider,
  UserContext,
} from "@eden/package-context";
import { FIND_GRANTS } from "@eden/package-graphql";
import {
  GrantTemplate,
  Members,
  Mutation,
} from "@eden/package-graphql/generated";
import {
  AppUserSubmenuLayout,
  Card,
  CardGrid,
  FillUserProfileContainer,
  GrantsCard,
  GrantsModalContainer,
  GridItemNine,
  GridItemSix,
  GridItemThree,
  GridLayout,
  SEO,
  SubmenuSelector,
  ViewUserProfileContainer,
  WarningCard,
} from "@eden/package-ui";
import { STEPS } from "@eden/package-ui/utils";
import { getFillProfilePercentage } from "@eden/package-ui/utils/fill-profile-percentage";
import { useContext, useEffect, useState } from "react";

import welcome from "../../public/welcome.png";
import type { NextPageWithLayout } from "../_app";

const ADD_NODES = gql`
  mutation ($fields: addNodesToMemberInput!) {
    addNodesToMember(fields: $fields) {
      _id
    }
  }
`;

const GrantsPage: NextPageWithLayout = () => {
  const { setOpenModal } = useContext(GrantsContext);
  const { currentUser } = useContext(UserContext);
  const [view, setView] = useState<"grants" | "profile">("grants");
  const [startWelcome, setStartWelcome] = useState(false);
  const [userState, setUserState] = useState<Members>();

  useEffect(() => {
    if (currentUser) {
      setUserState(currentUser);
    }
  }, [currentUser]);

  const { data: dataGrants } = useQuery(FIND_GRANTS, {
    variables: {
      fields: {
        _id: null,
        // serverID: selectedServerID,
      },
    },
    context: { serviceName: "soilservice" },
  });

  // if (dataGrants) console.log("dataGrants", dataGrants);

  const [addNodes] = useMutation(ADD_NODES, {
    onCompleted({ addNodesToMember }: Mutation) {
      if (!addNodesToMember) console.log("addNodesToMember is null");
      // console.log("updateMember", addNodesToMember);
      // setSubmitting(false);
    },
    onError(error) {
      console.log("error", error);
    },
  });

  useEffect(() => {
    if (
      currentUser &&
      getFillProfilePercentage(currentUser) < 30 &&
      !startWelcome
    ) {
      setOpenModal(GrantsModal.START_WELCOME);
      setStartWelcome(true);
    }
  }, [currentUser]);

  // ------- PROFILE VIEW -------
  const [step, setStep] = useState(STEPS.ROLE);

  const [experienceOpen, setExperienceOpen] = useState<number | null>(null);

  const handleAddNodes = (val: string[]) => {
    if (!currentUser || !val) return;
    addNodes({
      variables: {
        fields: {
          memberID: currentUser?._id,
          nodesID: val,
        },
      },
      context: { serviceName: "soilservice" },
    });
  };

  if (!currentUser) return null;

  return (
    <>
      <SEO />
      <GridLayout>
        {view === "grants" && (
          <>
            <GridItemThree>
              <Card className={`lg:h-85 flex flex-col gap-2`}>
                <Card shadow className={"bg-white p-6"}>
                  <SubmenuSelector title={`Good Morning,`} />
                </Card>
                {currentUser && getFillProfilePercentage(currentUser) < 50 && (
                  <WarningCard
                    profilePercentage={getFillProfilePercentage(currentUser)}
                    onClickCompleteProfile={() => setView("profile")}
                  />
                )}
              </Card>
            </GridItemThree>
            <GridItemNine>
              <Card
                shadow
                className="scrollbar-hide h-85 overflow-scroll bg-white p-4"
              >
                <CardGrid>
                  {dataGrants?.findGrants?.map(
                    (grant: GrantTemplate, index: number) => (
                      <GrantsCard key={index} grant={grant} />
                    )
                  )}
                </CardGrid>
              </Card>
            </GridItemNine>
          </>
        )}
        {view === "profile" && (
          <>
            <GridItemSix>
              <Card shadow className={"h-85 bg-white"}>
                <FillUserProfileContainer
                  step={step}
                  state={userState}
                  setState={setUserState}
                  setStep={setStep}
                  setExperienceOpen={setExperienceOpen}
                  setView={setView}
                  percentage={getFillProfilePercentage(currentUser)}
                />
              </Card>
            </GridItemSix>
            <GridItemSix>
              <Card shadow className={"h-85 bg-white"}>
                <ViewUserProfileContainer
                  step={step}
                  user={userState}
                  experienceOpen={experienceOpen}
                  setExperienceOpen={setExperienceOpen}
                />
              </Card>
            </GridItemSix>
          </>
        )}
      </GridLayout>
      <GrantsModalContainer
        image={welcome.src}
        setArrayOfNodes={(val) => {
          // console.log("array of nodes val", val);
          handleAddNodes(val);
        }}
        percentage={getFillProfilePercentage(currentUser)}
      />
    </>
  );
};

GrantsPage.getLayout = (page) => (
  <GrantsProvider>
    <AppUserSubmenuLayout showSubmenu={false}>{page}</AppUserSubmenuLayout>
  </GrantsProvider>
);

export default GrantsPage;

import { IncomingMessage, ServerResponse } from "http";
import { getSession } from "next-auth/react";

export async function getServerSideProps(ctx: {
  req: IncomingMessage;
  res: ServerResponse;
}) {
  const session = await getSession(ctx);

  const url = ctx.req.url?.replace("/", "");

  if (!session || session.error === "RefreshAccessTokenError") {
    return {
      redirect: {
        destination: `/login?redirect=${url}`,
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}
