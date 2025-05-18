import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

/**
 * FormattedNoteViewer component
 *
 * This component displays note content with proper formatting in preview mode.
 * It handles text formatting, breaks, and styling to make the content more readable.
 */
const FormattedNoteViewer = ({ note }) => {
  const { theme } = useTheme();

  // Format the content with proper styling
  const renderFormattedContent = (content) => {
    if (!content) return null;

    // Split by line breaks to handle paragraphs
    const paragraphs = content.split('\n');

    // Track if we're inside a list for proper spacing
    let inList = false;

    return paragraphs.map((paragraph, index) => {
      // Skip empty paragraphs but preserve space
      if (paragraph.trim() === '') {
        // Add more space between lists and other content
        const height = inList ? 4 : 12;
        inList = false;
        return <View key={index} style={{ height }} />;
      }

      // Check if this line might be a heading (starts with # or is all uppercase)
      const isHeading = paragraph.startsWith('#') ||
                       (paragraph.trim().length > 0 && paragraph.length < 50 &&
                        paragraph.trim() === paragraph.trim().toUpperCase());

      // Check for numbered list items (1. 2. etc)
      const isNumberedList = /^\s*(\d+)[\.\)]\s+/.test(paragraph);

      // Check if this line might be a bullet point
      const isBulletPoint = paragraph.trim().startsWith('-') ||
                          paragraph.trim().startsWith('•') ||
                          paragraph.trim().startsWith('*');

      // Check if this is a code block (starts with ```` or 4 spaces/tab)
      const isCodeBlock = paragraph.trim().startsWith('```') ||
                         paragraph.startsWith('    ') ||
                         paragraph.startsWith('\t');

      // Check for emphasized text (bold or italics)
      const hasEmphasis = paragraph.includes('**') ||
                         paragraph.includes('__') ||
                         paragraph.includes('*') ||
                         paragraph.includes('_');

      // Check for hyperlinks [text](url) or plain URLs
      const hasLinks = paragraph.includes('http://') ||
                      paragraph.includes('https://') ||
                      paragraph.includes('[') && paragraph.includes('](');

      // Helper function to open URLs
      const handleOpenLink = (url) => {
        Linking.canOpenURL(url).then(supported => {
          if (supported) {
            Linking.openURL(url);
          }
        });
      };

      if (isHeading) {
        inList = false;
        // Handle different heading levels
        const headingLevel = paragraph.startsWith('##') ? 2 :
                            paragraph.startsWith('#') ? 1 : 0;

        const headingStyle = [
          styles.heading,
          { color: theme.text },
          headingLevel === 2 ? styles.subheading : {}
        ];

        return (
          <Text key={index} style={headingStyle}>
            {paragraph.startsWith('#') ? paragraph.replace(/^#+\s*/, '') : paragraph}
          </Text>
        );
      } else if (isNumberedList) {
        inList = true;
        // Extract the number and the text
        const matches = paragraph.match(/^\s*(\d+)[\.\)]\s+(.*)/);
        if (matches && matches.length > 2) {
          const number = matches[1];
          const text = matches[2];

          return (
            <View key={index} style={styles.listItemContainer}>
              <View style={styles.numberContainer}>
                <Text style={[styles.numberBullet, { color: theme.primary }]}>{number}.</Text>
              </View>
              <Text style={[styles.paragraph, { color: theme.text }]}>{text}</Text>
            </View>
          );
        }

        // Fallback if regex fails
        return (
          <Text key={index} style={[styles.paragraph, { color: theme.text }]}>{paragraph}</Text>
        );
      } else if (isBulletPoint) {
        inList = true;
        return (
          <View key={index} style={styles.bulletPointContainer}>
            <Text style={[styles.bulletPoint, { color: theme.primary }]}>•</Text>
            <Text style={[styles.paragraph, { color: theme.text }]}>
              {paragraph.trim().startsWith('-') ||
               paragraph.trim().startsWith('•') ||
               paragraph.trim().startsWith('*')
                ? paragraph.trim().substring(1).trim()
                : paragraph}
            </Text>
          </View>
        );
      } else if (isCodeBlock) {
        inList = false;
        let codeContent = paragraph;

        // Remove backticks if they exist
        if (paragraph.trim().startsWith('```')) {
          // Get everything after the first line break or after the ```
          const parts = paragraph.split('\n');
          if (parts.length > 1) {
            // For multiline code blocks, we'd join all parts except first and last
            codeContent = parts.slice(1, parts.length - 1).join('\n');
          } else {
            // For inline code, remove the backticks
            codeContent = paragraph.replace(/```/g, '');
          }
        }
        // Remove leading spaces/tabs for indented code blocks
        else if (paragraph.startsWith('    ') || paragraph.startsWith('\t')) {
          codeContent = paragraph.replace(/^(\s{4}|\t)/g, '');
        }

        return (
          <View key={index} style={[
            styles.codeBlockContainer,
            {
              backgroundColor: theme.isDark ? theme.card : '#F5F5F5',
              borderLeftColor: theme.primary
            }
          ]}>
            <Text style={[styles.codeBlock, { color: theme.text }]}>{codeContent}</Text>
          </View>
        );
      } else if (hasEmphasis) {
        inList = false;
        // Process text with emphasis (improved implementation)
        // First, create a temporary paragraph to track the formatting
        const elements = [];
        let currentText = '';
        let isBold = false;
        let isItalic = false;

        // Process the paragraph character by character
        let i = 0;
        while (i < paragraph.length) {
          // Check for bold markdown (**text** or __text__)
          if ((paragraph.slice(i, i + 2) === '**' || paragraph.slice(i, i + 2) === '__') &&
              i + 2 < paragraph.length) {

            // Push any accumulated normal text before this marker
            if (currentText) {
              elements.push(
                <Text key={`${index}-normal-${elements.length}`} style={[styles.paragraph, { color: theme.text }]}>
                  {currentText}
                </Text>
              );
              currentText = '';
            }

            // Find the closing marker
            const openMarker = paragraph.slice(i, i + 2);
            let closingIndex = paragraph.indexOf(openMarker, i + 2);
            if (closingIndex === -1) {
              // No closing marker found, treat as normal text
              currentText += paragraph[i];
              i++;
            } else {
              // Extract the bold text
              const boldText = paragraph.slice(i + 2, closingIndex);
              elements.push(
                <Text key={`${index}-bold-${elements.length}`} style={[styles.paragraph, styles.bold, { color: theme.text }]}>
                  {boldText}
                </Text>
              );
              i = closingIndex + 2; // Skip past closing marker
            }
          }
          // Check for italic markdown (*text* or _text_)
          // Make sure it's not part of a bold marker
          else if ((paragraph[i] === '*' || paragraph[i] === '_') &&
                  !(i > 0 && paragraph[i-1] === paragraph[i]) &&
                  !(i < paragraph.length - 1 && paragraph[i+1] === paragraph[i])) {

            // Push any accumulated normal text before this marker
            if (currentText) {
              elements.push(
                <Text key={`${index}-normal-${elements.length}`} style={[styles.paragraph, { color: theme.text }]}>
                  {currentText}
                </Text>
              );
              currentText = '';
            }

            // Find the closing marker
            const marker = paragraph[i];
            let closingIndex = paragraph.indexOf(marker, i + 1);
            if (closingIndex === -1) {
              // No closing marker found, treat as normal text
              currentText += paragraph[i];
              i++;
            } else {
              // Extract the italic text
              const italicText = paragraph.slice(i + 1, closingIndex);
              elements.push(
                <Text key={`${index}-italic-${elements.length}`} style={[styles.paragraph, styles.italic, { color: theme.text }]}>
                  {italicText}
                </Text>
              );
              i = closingIndex + 1; // Skip past closing marker
            }
          }
          // Regular text
          else {
            currentText += paragraph[i];
            i++;
          }
        }

        // Add any remaining text
        if (currentText) {
          elements.push(
            <Text key={`${index}-normal-${elements.length}`} style={[styles.paragraph, { color: theme.text }]}>
              {currentText}
            </Text>
          );
        }

        return (
          <Text key={index} style={styles.paragraphContainer}>
            {elements}
          </Text>
        );
      } else if (hasLinks) {
        inList = false;

        // Process links in the text
        // Handle markdown style links [text](url)
        const elements = [];
        let remainingText = paragraph;

        // First, try to find markdown style links
        const markdownLinkRegex = /\[([^\]]+)\]$$([^)]+)$$/g;
        let linkMatch;
        let lastIndex = 0;

        // Check for markdown links like [text](url)
        while ((linkMatch = markdownLinkRegex.exec(paragraph)) !== null) {
          const [fullMatch, linkText, linkUrl] = linkMatch;

          // Add text before the link
          if (linkMatch.index > lastIndex) {
            const textBefore = paragraph.substring(lastIndex, linkMatch.index);
            elements.push(
              <Text key={`${index}-text-${elements.length}`} style={[styles.paragraph, { color: theme.text }]}>
                {textBefore}
              </Text>
            );
          }

          // Add the link
          elements.push(
            <Text
              key={`${index}-link-${elements.length}`}
              style={[styles.paragraph, styles.link, { color: theme.primary }]}
              onPress={() => handleOpenLink(linkUrl)}
            >
              {linkText}
            </Text>
          );

          lastIndex = linkMatch.index + fullMatch.length;
        }

        // Add any remaining text after the last link
        if (lastIndex < paragraph.length) {
          // For the remaining text, handle plain URLs
          const urlRegex = /(https?:\/\/[^\s]+)/g;
          const remainingPart = paragraph.substring(lastIndex);
          let urlMatch;
          let urlLastIndex = 0;

          while ((urlMatch = urlRegex.exec(remainingPart)) !== null) {
            // Add regular text before the URL
            if (urlMatch.index > urlLastIndex) {
              const textBefore = remainingPart.substring(urlLastIndex, urlMatch.index);
              elements.push(
                <Text key={`${index}-text-url-${elements.length}`} style={[styles.paragraph, { color: theme.text }]}>
                  {textBefore}
                </Text>
              );
            }

            // Add the URL as a clickable link
            elements.push(
              <Text
                key={`${index}-url-${elements.length}`}
                style={[styles.paragraph, styles.link, { color: theme.primary }]}
                onPress={() => handleOpenLink(urlMatch[0])}
              >
                {urlMatch[0]}
              </Text>
            );

            urlLastIndex = urlMatch.index + urlMatch[0].length;
          }

          // Add any remaining text
          if (urlLastIndex < remainingPart.length) {
            elements.push(
              <Text key={`${index}-text-final-${elements.length}`} style={[styles.paragraph, { color: theme.text }]}>
                {remainingPart.substring(urlLastIndex)}
              </Text>
            );
          }
        }

        if (elements.length === 0) {
          // No links were detected, fallback to regular text
          return (
            <Text key={index} style={[styles.paragraph, { color: theme.text }]}>
              {paragraph}
            </Text>
          );
        }

        return (
          <Text key={index} style={styles.paragraphContainer}>
            {elements}
          </Text>
        );
      } else {
        return (
          <Text key={index} style={[styles.paragraph, { color: theme.text }]}>
            {paragraph}
          </Text>
        );
      }
    });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContentContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      horizontal={false}
    >
      <View style={styles.contentContainer}>
        <View style={styles.noteHeader}>
          <Text style={[styles.noteTitle, { color: theme.text }]}>{note.title}</Text>
          {note.subject && (
            <View style={[styles.subjectBadge, { backgroundColor: theme.primaryLight }]}>
              <Text style={[styles.subjectText, { color: theme.primary }]}>{note.subject}</Text>
            </View>
          )}
          {note.aiGenerated && (
            <View style={[styles.aiBadge, { backgroundColor: theme.accent || '#FF8A65' }]}>
              <Ionicons name="sparkles-outline" size={14} color="#FFFFFF" />
              <Text style={styles.aiBadgeText}>AI Generated</Text>
            </View>
          )}
        </View>

        {note.description && (
          <Text style={[styles.description, { color: theme.textSecondary }]}>{note.description}</Text>
        )}

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.formattedContent}>
          {renderFormattedContent(note.content)}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 8,
    padding: 5,
  },
  scrollContentContainer: {
    paddingBottom: 10,
    // paddingHorizontal: 16,

  },
  contentContainer: {
    width: '100%',
  },
  noteHeader: {
    marginBottom: 16,
  },
  noteTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  formattedContent: {
    marginTop: 8,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
  },
  subheading: {
    fontSize: 16,
    fontWeight: '600',
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  paragraphContainer: {
    marginBottom: 12,
  },
  bulletPointContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 8,
  },
  bulletPoint: {
    fontSize: 16,
    marginRight: 8,
    fontWeight: 'bold',
  },
  numberContainer: {
    minWidth: 24,
    marginRight: 8,
  },
  numberBullet: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  listItemContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 8,
  },
  bold: {
    fontWeight: 'bold',
  },
  italic: {
    fontStyle: 'italic',
  },
  link: {
    textDecorationLine: 'underline',
  },
  codeBlockContainer: {
    borderRadius: 4,
    padding: 8,
    marginBottom: 16,
    borderLeftWidth: 3,
  },
  codeBlock: {
    fontFamily: 'monospace',
    fontSize: 14,
    lineHeight: 20,
  },
  subjectBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  subjectText: {
    fontSize: 14,
    fontWeight: '500',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  aiBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
});

export default FormattedNoteViewer;