/* eslint-disable @next/next/no-img-element */
/* eslint-disable no-unused-vars */
import { useUserReviews } from "@/services/api/reviews";
import {
  useArchiveTranscript,
  useClaimTranscript,
  useTranscripts,
} from "@/services/api/transcripts";
import {
  calculateReadingTime,
  convertStringToArray,
  displaySatCoinImage,
  tagColors,
} from "@/utils";
import { Button, CheckboxGroup, Text, useToast } from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Transcript } from "../../../types";
import BaseTable from "./BaseTable";
import Pagination from "./Pagination";
import TitleWithTags from "./TitleWithTags";
import { TableStructure } from "./types";

type AdminArchiveSelectProps = {
  children: (props: {
    handleArchive: () => Promise<void>;
    hasAdminSelected: boolean;
    isArchiving: boolean;
  }) => React.ReactNode;
};

const AdminArchiveSelect = ({ children }: AdminArchiveSelectProps) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const toast = useToast();
  const { data: userSession } = useSession();
  const queryClient = useQueryClient();
  const archiveTranscript = useArchiveTranscript();

  const handleCheckboxToggle = (values: (string | number)[]) => {
    setSelectedIds(values.map(String));
  };
  const handleArchive = async () => {
    const ids = selectedIds.map(Number);

    if (userSession?.user?.id) {
      const archivedBy = userSession?.user.id;
      try {
        await Promise.all(
          ids.map((transcriptId) =>
            archiveTranscript.mutateAsync({
              transcriptId,
              archivedBy,
            })
          )
        );

        queryClient.invalidateQueries(["transcripts"]);
        setSelectedIds([]);
        toast({
          status: "success",
          title: "Archived successfully",
        });
      } catch (err) {
        const error = err as Error;
        toast({
          status: "error",
          title: "Error while archiving transcript",
          description: error?.message,
        });
      }
    } else {
      await signOut({ redirect: false });
      signIn("github");
    }
  };

  return (
    <CheckboxGroup colorScheme="orange" onChange={handleCheckboxToggle}>
      {children({
        handleArchive,
        hasAdminSelected: selectedIds.length > 0,
        isArchiving: archiveTranscript.isLoading,
      })}
    </CheckboxGroup>
  );
};

const QueueTable = () => {
  const { data: session, status } = useSession();
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();
  const claimTranscript = useClaimTranscript();
  const { data, isLoading, isError, refetch } = useTranscripts(currentPage);
  const { data: userReviews } = useUserReviews({
    userId: session?.user?.id,
    status: "active",
  });
  const [totalPages, setTotalPages] = useState<number>(data?.totalPages || 0);
  const toast = useToast();

  const retriedClaim = useRef(0);

  const [claimState, setClaimState] = useState({
    rowId: -1,
  });

  // Determines if current user can claim a review by checking for their active reviews
  const canClaimTranscript = useMemo(() => {
    // logical operator is false by default
    return !userReviews?.data?.length && Boolean(session?.user?.id);
  }, [userReviews, session]);

  const retryLoginAndClaim = async (transcriptId: number) => {
    await signOut({ redirect: false });
    if (retriedClaim.current < 2) {
      retriedClaim.current += 1;
      await signIn("github", {
        callbackUrl: `/?reclaim=true&transcriptId=${transcriptId}`,
      });
    }
  };

  const handleClaim = useCallback(
    async (transcriptId: number) => {
      if (status === "loading") {
        toast({
          status: "loading",
          title: "loading fun",
          description: "loading up some fun for you... please wait.",
        });
        return;
      } else if (status === "unauthenticated") {
        // Sign-in user before trying to claim a transcript
        await signIn("github", {
          callbackUrl: `/?reclaim=true&transcriptId=${transcriptId}`,
        });
        return;
      }
      if (session?.user?.id) {
        setClaimState((prev) => ({ ...prev, rowId: transcriptId }));

        // Claim transcript
        claimTranscript.mutate(
          { userId: session.user.id, transcriptId },
          {
            onSuccess: async (data) => {
              // Fork repo
              axios.post("/api/github/fork");

              setClaimState((prev) => ({ ...prev, rowId: -1 }));
              if (data instanceof Error) {
                await retryLoginAndClaim(transcriptId);
                return;
              }
              router.push(`/reviews/${data.id}`);
            },

            onError: (err) => {
              const error = err as Error;
              setClaimState((prev) => ({ ...prev, rowId: -1 }));
              toast({
                status: "error",
                title: error?.message,
              });
            },
          }
        );
      } else {
        await retryLoginAndClaim(transcriptId);
      }
    },
    [status, session?.user?.id, claimTranscript, router, toast]
  );
  // updated totalPages if data changes
  useEffect(() => {
    if (data) {
      setTotalPages(data?.totalPages || 0);
    }
  }, [data]);
  // Reclaim transcript when there's a reclaim query
  useEffect(() => {
    const { reclaim, transcriptId } = router.query;
    if (
      reclaim &&
      transcriptId &&
      data &&
      status === "authenticated" &&
      retriedClaim.current < 2
    ) {
      retriedClaim.current = 2;
      handleClaim(Number(transcriptId));
    }
  }, [data, router, handleClaim, status]);

  const tableStructure = useMemo(
    () =>
      [
        {
          name: "Title",
          type: "default",
          component: (data) => {
            const allTags = convertStringToArray(data.content.tags);
            return (
              <TitleWithTags
                title={data.content.title}
                allTags={allTags}
                categories={data.content.categories}
                id={data.id}
                length={allTags.length}
              />
            );
          },
        },
        {
          name: "speakers",
          type: "tags",
          modifier: (data) => data.content.speakers,
        },
        {
          name: "Time to edit",
          type: "text-short",
          modifier: (data) => (
            <Text>
              {`~${calculateReadingTime(Number(data.contentTotalWords))}`}
            </Text>
          ),
        },
        {
          name: "Sats",
          type: "text-short",
          modifier: (data) => (
            <img
              alt={`${data.contentTotalWords} sat coins`}
              src={displaySatCoinImage(data.contentTotalWords)}
            />
          ),
        },
        // { name: "bounty rate", type: "text-short", modifier: (data) => "N/A" },
        {
          name: "Claim",
          actionName: "Claim",
          type: "action",
          modifier: (data) => data.id,
          component: (data) => (
            <Button
              bgColor={"#EB9B00"}
              color="white"
              _hover={{ bgColor: "#EB9B00AE" }}
              _active={{ bgColor: "#EB9B0050" }}
              size="sm"
              onClick={() => handleClaim(data.id)}
            >
              Claim
            </Button>
          ),
        },
      ] as TableStructure<Transcript>[],
    [handleClaim]
  );

  // TODO: extract and refactor claim logic into a claim ActionComponent

  return (
    <AdminArchiveSelect>
      {({ handleArchive, hasAdminSelected, isArchiving }) => (
        <>
          <BaseTable
            actionState={claimState}
            data={data?.data}
            emptyView="There are no transcripts awaiting review"
            handleArchive={handleArchive}
            hasAdminSelected={hasAdminSelected}
            isError={isError}
            isArchiving={isArchiving}
            isLoading={isLoading}
            refetch={refetch}
            showAdminControls
            tableHeader="Transcripts waiting for review"
            tableStructure={tableStructure}
          />
          <Pagination
            setCurrentPage={setCurrentPage}
            currentPage={currentPage}
            pages={totalPages}
          />
        </>
      )}
    </AdminArchiveSelect>
  );
};

export default QueueTable;
