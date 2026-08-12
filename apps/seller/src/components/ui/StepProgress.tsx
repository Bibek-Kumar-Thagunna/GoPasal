import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { colors } from '../../design-system/tokens/colors';

function Text({ style, children }: any) {
  return (
    <Animated.Text style={[{ fontFamily: 'Inter', color: colors.neutral[900] }, style]}>
      {children}
    </Animated.Text>
  );
}

interface Step {
  label: string;
  key: string;
}

interface StepProgressProps {
  steps: Step[];
  currentStep: number; // 0-indexed
}

export function StepProgress({ steps, currentStep }: StepProgressProps) {
  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isPending = index > currentStep;

        return (
          <View key={step.key} style={styles.stepWrap}>
            <View style={[
              styles.pill,
              isCompleted && styles.pillCompleted,
              isCurrent && styles.pillCurrent,
              isPending && styles.pillPending,
            ]}>
              {isCompleted ? (
                <Ionicons name="checkmark-circle" size={16} color={colors.success.main} />
              ) : (
                <View style={[
                  styles.stepDot,
                  isCurrent && styles.stepDotCurrent,
                  isPending && styles.stepDotPending,
                ]} />
              )}
              <Text style={[
                styles.stepLabel,
                isCompleted && styles.stepLabelCompleted,
                isCurrent && styles.stepLabelCurrent,
                isPending && styles.stepLabelPending,
              ]}>
                {step.label}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  stepWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  pillCompleted: {
    backgroundColor: colors.success.light,
    borderColor: colors.success.main,
  },
  pillCurrent: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
  },
  pillPending: {
    backgroundColor: colors.neutral[50],
    borderColor: colors.neutral[200],
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.neutral[300],
  },
  stepDotCurrent: {
    backgroundColor: colors.primary[500],
  },
  stepDotPending: {
    backgroundColor: colors.neutral[300],
  },
  stepLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
  },
  stepLabelCompleted: {
    color: colors.success.dark,
  },
  stepLabelCurrent: {
    color: colors.primary[500],
    fontFamily: 'Inter-SemiBold',
  },
  stepLabelPending: {
    color: colors.neutral[400],
  },
});
