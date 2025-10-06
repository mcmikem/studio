"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

interface StepperContextValue extends StepperProps {
  clickable?: boolean
  isError?: boolean
  isLoading?: boolean
  isVertical?: boolean
  stepCount?: number
  expandVerticalSteps?: boolean
  activeStep: number
  initialStep: number
}

const StepperContext = React.createContext<
  StepperContextValue & {
    nextStep: () => void
    prevStep: () => void
    resetSteps: () => void
    setStep: (step: number) => void
  }
>({
  steps: [],
  activeStep: 0,
  initialStep: 0,
  nextStep: () => {},
  prevStep: () => {},
  resetSteps: () => {},
  setStep: () => {},
})

const stepperVariants = cva("flex w-full flex-col gap-4", {
  variants: {
    orientation: {
      vertical: "flex-col",
      horizontal: "flex-row",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
})

interface StepperProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof stepperVariants> {
  children?: React.ReactNode
  initialStep?: number
  steps: {
    label?: string
    description?: string
    icon?: React.ReactNode
  }[]
}

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  (
    {
      className,
      children,
      orientation = "horizontal",
      initialStep = 0,
      steps,
      ...props
    },
    ref
  ) => {
    const isVertical = orientation === "vertical"

    const [activeStep, setActiveStep] = React.useState(initialStep)

    const nextStep = () => {
      setActiveStep((prev) => Math.min(prev + 1, steps.length - 1))
    }

    const prevStep = () => {
      setActiveStep((prev) => Math.max(prev - 1, 0))
    }

    const resetSteps = () => {
      setActiveStep(initialStep)
    }

    const setStep = (step: number) => {
      setActiveStep(Math.max(0, Math.min(step, steps.length - 1)))
    }

    return (
      <StepperContext.Provider
        value={{
          ...props,
          steps,
          activeStep,
          initialStep,
          isVertical,
          nextStep,
          prevStep,
          resetSteps,
          setStep,
        }}
      >
        <div
          ref={ref}
          className={cn(
            "stepper__main-container",
            stepperVariants({ orientation }),
            className
          )}
          {...props}
        >
          <div
            className={cn(
              "stepper__steps-container",
              "flex items-center",
              isVertical ? "flex-col" : "flex-row"
            )}
          >
            {steps.map((step, index) => (
              <div
                key={index}
                className={cn(
                  "stepper__step-container-outer",
                  "flex items-center",
                  isVertical ? "flex-col" : "flex-row"
                )}
              >
                <div
                  className={cn(
                    "stepper__step-container-inner",
                    "flex items-center gap-2",
                    isVertical ? "flex-col" : "flex-row"
                  )}
                >
                  <div
                    className={cn(
                      "stepper__step",
                      "flex items-center justify-center rounded-full border-2",
                      "h-8 w-8 text-sm font-medium",
                      index < activeStep &&
                        "bg-primary border-primary text-primary-foreground",
                      index === activeStep && "border-primary",
                      index > activeStep && "border-muted-foreground"
                    )}
                  >
                    {index < activeStep ? <Check /> : index + 1}
                  </div>

                  <div
                    className={cn(
                      "stepper__step-label-container text-center",
                      "flex flex-col"
                    )}
                  >
                    <p className="stepper__step-label text-sm font-medium">
                      {step.label}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "stepper__separator",
                      "bg-muted-foreground/20",
                      isVertical ? "w-px h-8 my-2" : "h-px w-16 mx-2"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
          {React.Children.toArray(children)[activeStep]}
        </div>
      </StepperContext.Provider>
    )
  }
)

Stepper.displayName = "Stepper"

const Step = React.forwardRef<
  HTMLDivElement,
  {
    children?: React.ReactNode
  } & React.HTMLAttributes<HTMLDivElement>
>(({ children, className, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("w-full", className)} {...props}>
      {children}
    </div>
  )
})

Step.displayName = "Step"

function useStepper() {
  const context = React.useContext(StepperContext)

  if (context === undefined) {
    throw new Error("useStepper must be used within a Stepper.")
  }

  const { children, ...rest } = context

  const isLastStep = context.activeStep === context.steps.length - 1
  const isFirstStep = context.activeStep === 0

  return {
    ...rest,
    isLastStep,
    isFirstStep,
  }
}

export { Stepper, Step, useStepper }
    