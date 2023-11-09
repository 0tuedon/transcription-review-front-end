import React, { useEffect, useState } from "react";
import StepLayout from "../StepLayout";
import { Box, Flex, Text } from "@chakra-ui/react";
import SubStepSingle from "./SubStepSingle";
import Image from "next/image";
import CarouselCards from "../CarouselCards";
import { ICarouselCardSlide } from "../CarouselCardSlide";

const Step3 = () => {
  const images = ["/home/authorize-landing.png", "/home/raw-markdown.png"];
  const [currentIndex, setCurrentIndex] = useState(0);
  const step3Contents: ICarouselCardSlide[] = [
    {
      fullImage: "/home/submit-pr.png",
      heading: "Submission",
      icon: "/home/submission.png",
      desc: "Once you submit your transcript, it will create a PR (pull request)* of your edited transcript from the original transcript",
    },
    {
      fullImage: "",
      heading: "Check the PR",
      icon: "/home/check-pr.png",
      desc: "If you want to see your transcript, visit your profile and click the link. On the transcript’s GitHub PR, you can click the “Files changed” nav button to view.",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, 10000); // Change slide every 3 seconds (3000 milliseconds)

    return () => {
      clearInterval(interval);
    };
  });
  return (
    <StepLayout
      stepNumber={3}
      heading="Submit the edited transcript"
      sub="TLDR; Once you submit, you’re done! The submitted transcripts are reviewed by a human and then published via GitHub"
    >
      <Flex flexDir={"column"} gap={10}>
        <Box display={{ base: "block", md: "none" }}>
          <CarouselCards stepContents={step3Contents} />
        </Box>
        <Flex
          pt={"70px"}
          px="70px"
          flexDir={"column"}
          borderWidth={2}
          gap={20}
          width="100%"
          display={{ base: "none", md: "flex" }}
          borderColor={"#D9D9D9"}
          borderRadius={"30px 0px 30px 30px"}
        >
          <Flex gap={10}>
            <SubStepSingle
              isActive={currentIndex === 0}
              heading="Submission"
              sub="Once you submit your transcript, it will create a PR (pull request)* of your edited transcript from the original transcript"
              maxW="528px"
            />
            <SubStepSingle
              isActive={currentIndex === 15}
              heading="Check the PR"
              sub="If you want to see your transcript, visit your profile and click the link. On the transcript’s GitHub PR, you can click the “Files changed” nav button to view."
              maxW="660px"
            />
          </Flex>
          <Box
            p={2}
            borderWidth={2}
            borderColor={"#D9D9D9"}
            borderRadius={"30px 30px 0px 0px"}
          >
            {images.map((image, index) => (
              <Box
                className={`slides ${
                  index === currentIndex ? "active" : "hidden"
                } `}
                minH={"400px"}
                width={"100%"}
                position={"relative"}
                marginBottom={"-7px"}
                key={image}
              >
                <Image
                  src={image}
                  alt="authorize github page"
                  fill
                  style={{
                    borderRadius: "30px 30px 0px 0px",
                    objectFit: "cover",
                  }}
                />
              </Box>
            ))}
          </Box>
        </Flex>

        <Flex
          py={{ base: "20px", lg: "70px" }}
          px={{ base: "14px", lg: "70px" }}
          justifyContent={"space-between"}
          flexDir={{ base: "column", lg: "row" }}
          gap={10}
          borderWidth={2}
          borderColor={"#D9D9D9"}
          borderRadius={{ base: "12px", lg: "30px 0px 30px 30px" }}
          fontFamily={"Aeonik Fono"}
          fontSize={{ base: "0.75rem", lg: "1.3rem", xl: "1.8rem" }}
        >
          <Text lineHeight={"135%"}>
            <Text as={"span"} fontWeight={700}>
              *Nerd stuff:
            </Text>{" "}
            Pull Requests (also called PRs or merge requests) inform others that
            you’re making a change from an original piece of code. The
            transcript text is technically code because it’s what the live site
            uses. The original code was the transcript before you made the
            edits. So, you “pulled” that code and are requesting your new,
            edited code to be used instead.
          </Text>
        </Flex>

        <Flex
          py={{ base: "20px", lg: "70px" }}
          px={{ base: "14px", lg: "70px" }}
          justifyContent={"space-between"}
          flexDir={{ base: "column", lg: "row" }}
          gap={{ base: 4, lg: 10 }}
          borderWidth={2}
          borderColor={"#D9D9D9"}
          borderRadius={{ base: "12px", lg: "30px 0px 30px 30px" }}
        >
          <Flex
            flexDir={"column"}
            lineHeight={"135%"}
            gap={8}
            fontSize={{ base: "0.75rem", lg: "1.3rem", xl: "1.8rem" }}
            fontFamily={"Polysans"}
          >
            <Text>
              <Text as="span" fontWeight={700}>
                After Submission:{" "}
              </Text>
              Your edited code or transcript will be reviewed by a human.
            </Text>
            <Text>
              Once approved, it will be published. If it&apos;s not accepted,
              you can make further changes through GitHub conversations.
            </Text>
            <Text>
              After publication, you&apos;ll receive Sats in your account wallet
              as a token of appreciation, which you can withdraw to your
              preferred Lightning wallet.
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </StepLayout>
  );
};

export default Step3;
