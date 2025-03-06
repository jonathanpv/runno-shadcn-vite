import React, { useRef, useState, useLayoutEffect, useCallback, useEffect } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { useTheme } from "@/components/theme-provider";

interface XtermTerminalProps {
  output?: string;
  onInput?: (input: string) => void;
  isRunning?: boolean;
  isError?: boolean;
}

function XTermTerminal({ 
  output = '', 
  onInput,
  isRunning = false,
  isError = false
}: XtermTerminalProps) {
  // Add theme awareness
  const { theme } = useTheme();
  
  // Refs for DOM elements and terminal instance
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const outputQueueRef = useRef<string[]>([]);
  const observerRef = useRef<ResizeObserver | null>(null);
  const lastOutputRef = useRef<string>('');
  const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDraggingRef = useRef(false);
  
  // Add a new ref to track run cycles
  const runCycleRef = useRef<number>(0);
  
  // Initialize terminal once when container is ready
  const initializeTerminal = useCallback(() => {
    console.log('XTermTerminal: initializeTerminal called, terminal exists:', !!xtermRef.current);
    if (!terminalRef.current || xtermRef.current) return;
    
    console.log('XTermTerminal: Creating new terminal instance');
    
    // Get computed styles to read current CSS variables
    const computedStyle = getComputedStyle(document.documentElement);
    const bgColor = computedStyle.getPropertyValue('--syntax-bg-color').trim();
    const textColor = computedStyle.getPropertyValue('--syntax-text-color').trim();
    
    console.log('XTermTerminal: Using colors:', { bgColor, textColor });
    
    const terminal = new Terminal({
      cursorBlink: true,
      fontFamily: 'monospace',
      fontSize: 14,
      theme: {
        background: bgColor || 'var(--syntax-bg-color)',
        foreground: textColor || 'var(--syntax-text-color)',
        cursor: textColor || 'var(--syntax-text-color)'
      },
      rows: 10,
      cols: 80,
      allowTransparency: true,
      convertEol: true,
      lineHeight: 1.2
    });
    
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    
    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;
    
    try {
      console.log('XTermTerminal: Opening terminal in DOM element');
      terminal.open(terminalRef.current);
      
      // Process any queued output
      if (outputQueueRef.current.length > 0) {
        console.log('XTermTerminal: Processing queued output, count:', outputQueueRef.current.length);
        outputQueueRef.current.forEach(text => terminal.write(text));
        outputQueueRef.current = [];
      }
      
      // Handle user input if needed
      if (onInput) {
        terminal.onData(data => {
          if (!isRunning) return;
          
          terminal.write(data);
          
          if (data === '\r' || data === '\n') {
            const currentLine = terminal.buffer.active.getLine(terminal.buffer.active.cursorY)?.translateToString() || '';
            onInput(currentLine.trim());
            terminal.write('\r\n');
          }
        });
      }
      
      // Initial fit
      setTimeout(() => {
        console.log('XTermTerminal: Initial terminal fit');
        fitAddon.fit();
      }, 50);
      
    } catch (e) {
      console.error('Failed to initialize terminal:', e);
      xtermRef.current = null;
      fitAddonRef.current = null;
    }
  }, [onInput, isRunning]);
  
  // Set up resize observer
  const setupResizeObserver = useCallback(() => {
    if (!terminalRef.current || observerRef.current) return;
    
    // Setup drag detection
    const handleMouseDown = () => {
      isDraggingRef.current = true;
      
      // Apply a class to reduce visual updates during drag
      if (terminalRef.current) {
        terminalRef.current.classList.add('resizing');
      }
      
      document.addEventListener('mouseup', handleMouseUp, { once: true });
    };
    
    const handleMouseUp = () => {
      isDraggingRef.current = false;
      
      // Remove the class
      if (terminalRef.current) {
        terminalRef.current.classList.remove('resizing');
      }
      
      // Fit the terminal once after dragging stops
      if (fitAddonRef.current && xtermRef.current) {
        setTimeout(() => {
          try {
            fitAddonRef.current?.fit();
          } catch (e) {
            console.warn('Error fitting terminal after resize:', e);
          }
        }, 100);
      }
    };
    
    // Find the resize handle and attach listeners
    const resizeHandles = document.querySelectorAll('.ResizableHandle');
    resizeHandles.forEach(handle => {
      handle.addEventListener('mousedown', handleMouseDown);
    });
    
    observerRef.current = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry?.contentRect.width > 0 && entry?.contentRect.height > 0) {
        // Initialize terminal if not already done
        if (!xtermRef.current) {
          initializeTerminal();
          return;
        }
        
        // If actively dragging, don't refit during the drag operation
        if (isDraggingRef.current) {
          return;
        }
        
        // Clear any pending resize timer
        if (resizeTimerRef.current) {
          clearTimeout(resizeTimerRef.current);
        }
        
        // Set a new timer - only fit after resizing stops
        resizeTimerRef.current = setTimeout(() => {
          if (fitAddonRef.current) {
            try {
              fitAddonRef.current.fit();
            } catch (e) {
              console.warn('Error fitting terminal on resize:', e);
            }
          }
          resizeTimerRef.current = null;
        }, 300); // Longer delay to ensure resize is complete
      }
    });
    
    observerRef.current.observe(terminalRef.current);
    
    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      resizeHandles.forEach(handle => {
        handle.removeEventListener('mousedown', handleMouseDown);
      });
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current);
      }
    };
  }, [initializeTerminal]);
  
  // Update the useLayoutEffect for isRunning to increment the run cycle
  useLayoutEffect(() => {
    console.log('XTermTerminal: isRunning changed to', isRunning);
    if (isRunning && xtermRef.current) {
      console.log('XTermTerminal: Clearing terminal because isRunning=true');
      xtermRef.current.clear();
      
      // Reset the lastOutputRef when isRunning becomes true
      // so that identical outputs will still be processed
      console.log('XTermTerminal: Resetting lastOutputRef from:', lastOutputRef.current);
      lastOutputRef.current = '';
      
      // Increment run cycle counter to force update even with same output
      runCycleRef.current += 1;
      console.log('XTermTerminal: Incremented run cycle to:', runCycleRef.current);
    }
  }, [isRunning]);
  
  // Update processOutput function to consider run cycles
  const processOutput = useCallback(() => {
    console.log('XTermTerminal: processOutput called with output:', output?.substring(0, 50) + (output?.length > 50 ? '...' : ''));
    console.log('XTermTerminal: lastOutputRef is:', lastOutputRef.current?.substring(0, 50) + (lastOutputRef.current?.length > 50 ? '...' : ''));
    
    // Only skip if output is empty
    if (!output) {
      console.log('XTermTerminal: Output empty, skipping update');
      return;
    }
    
    // Always process the output if it's different from last time
    // or if we've recently started a new run
    if (output === lastOutputRef.current) {
      console.log('XTermTerminal: Output unchanged, but checking if we need to update anyway');
    }
    
    console.log('XTermTerminal: Updating lastOutputRef and processing new output');
    lastOutputRef.current = output;
    
    if (xtermRef.current) {
      try {
        console.log('XTermTerminal: Terminal exists, writing output');
        let formattedOutput = output
          .replace(/\r\n/g, '\n')
          .replace(/\r/g, '\n');
        
        // If this is error output, add ANSI color code for red text
        if (isError && !formattedOutput.includes('\x1b[')) {
          console.log('XTermTerminal: Formatting as error output');
          formattedOutput = `\x1b[31m${formattedOutput}\x1b[0m`;
        }
        
        console.log('XTermTerminal: Writing to terminal, output length:', formattedOutput.length);
        xtermRef.current.write(formattedOutput);
        
        // Only fit if we're not in the middle of a resize/drag operation
        if (!isDraggingRef.current) {
          console.log('XTermTerminal: Scheduling terminal fit');
          const fitTimer = setTimeout(() => {
            if (fitAddonRef.current && document.visibilityState !== 'hidden') {
              try {
                console.log('XTermTerminal: Fitting terminal after output');
                fitAddonRef.current.fit();
              } catch (e) {
                console.warn('Error fitting after output:', e);
              }
            }
          }, 50);
          
          return () => {
            console.log('XTermTerminal: Clearing fit timer');
            clearTimeout(fitTimer);
          };
        }
      } catch (e) {
        console.warn('Error writing to terminal:', e);
      }
    } else {
      // Queue output until terminal is ready
      console.log('XTermTerminal: Terminal not ready, queueing output');
      outputQueueRef.current.push(output);
    }
  }, [output, isError]);
  
  // Use useLayoutEffect for DOM measurements and setup
  useLayoutEffect(() => {
    console.log('XTermTerminal: Main useLayoutEffect running');
    // Setup the observer first
    const cleanup = setupResizeObserver();
    
    // Process output whenever it changes
    console.log('XTermTerminal: Calling processOutput from useLayoutEffect');
    processOutput();
    
    // Add CSS for resizing state
    const style = document.createElement('style');
    style.textContent = `      .resizing .xterm {
        pointer-events: none;
        opacity: 0.7;
        transition: none !important;
      }
    `;
    document.head.appendChild(style);
    
    // Clean up terminal on unmount
    return () => {
      console.log('XTermTerminal: Cleanup function called');
      cleanup?.();
      if (xtermRef.current) {
        console.log('XTermTerminal: Disposing terminal');
        xtermRef.current.dispose();
        xtermRef.current = null;
        fitAddonRef.current = null;
      }
      document.head.removeChild(style);
    };
  }, [setupResizeObserver, processOutput]);

  // Update terminal theme when theme context changes
  useEffect(() => {
    // If terminal exists, destroy and recreate it to fully apply the theme
    if (xtermRef.current) {
      // Save any current content to restore after recreation
      const currentContent = output || lastOutputRef.current;
      const tempContainer = terminalRef.current;
      
      // Dispose the current terminal
      xtermRef.current.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
      
      // Clear container contents
      if (tempContainer) {
        while (tempContainer.firstChild) {
          tempContainer.removeChild(tempContainer.firstChild);
        }
      }
      
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        // Initialize a new terminal
        initializeTerminal();
        
        // Restore content if needed
        if (currentContent && currentContent.length > 0 && xtermRef.current) {
          let formattedOutput = currentContent
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n');
          
          // Apply error formatting if needed
          if (isError && !formattedOutput.includes('\x1b[')) {
            formattedOutput = `\x1b[31m${formattedOutput}\x1b[0m`;
          }
          
          xtermRef.current.write(formattedOutput);
          
          // Fit after writing content
          setTimeout(() => {
            if (fitAddonRef.current) {
              try {
                fitAddonRef.current.fit();
              } catch (e) {
                console.warn('Error fitting terminal after recreation:', e);
              }
            }
          }, 50);
        }
      }, 20);
    }
  }, [theme, initializeTerminal, output, isError]); // Re-run when theme changes

  return (
    <div 
      ref={terminalRef} 
      className="w-full h-full relative"
      style={{ 
        backgroundColor: 'var(--syntax-bg-color)',
        color: 'var(--syntax-text-color)',
        borderRadius: '0.375rem',
        overflow: 'hidden',
        fontFeatureSettings: '"liga" 0',
        WebkitFontSmoothing: 'antialiased'
      }}
    />
  );
}

export { XTermTerminal }; 
