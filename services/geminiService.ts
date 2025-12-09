
import { GoogleGenAI, Type } from "@google/genai";
import { RobotState, GeometryType, JointType, MotorSpec } from '../types';

interface AIResponse {
  explanation: string;
  actionType: 'modification' | 'generation' | 'advice';
  robotData?: Partial<RobotState>;
}

// Helper to decode Base64 UTF-8 strings using TextDecoder
const b64DecodeUnicode = (str: string) => {
  try {
    const binaryString = atob(str);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch (e) {
    console.warn("Failed to decode base64 string", e);
    return "";
  }
};

// Encoded Easter Eggs (Key -> Value)
// Keys must be exact matches of the user prompt
const EGGS: Record<string, string> = {
  "6L6+5aaZ56eR5oqA": "5Y+R5p2l6LS655S1", // 达妙科技 
  "54G16Laz5pe25Luj": "56Wd5L2g5oiQ5Yqf", 
  "5Zug5YWL5pav5pm66IO9": "56Wd6ICB5p2/5aW95biF77yB", 
  "6auY5pOO5py655S1": "5oiR54ix5bCP5rS+77yB", 
  "5Zyw55Oc5py65LmZ5Lq6": "5Y+R5p2l54Oo5Zyw55Oc" 
};

export const generateRobotFromPrompt = async (
  prompt: string, 
  currentRobot: RobotState,
  motorLibrary: Record<string, MotorSpec[]>
): Promise<AIResponse | null> => {
  
  // Easter Egg Check
  const trimPrompt = prompt.trim();
  for (const [key, val] of Object.entries(EGGS)) {
      const decodedKey = b64DecodeUnicode(key);
      if (trimPrompt === decodedKey) {
          return {
              explanation: b64DecodeUnicode(val),
              actionType: 'advice'
          };
      }
  }

  if (!process.env.API_KEY) {
    console.error("API Key missing");
    return {
        explanation: "API Key is missing. Please configure the environment.",
        actionType: 'advice'
    };
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Simplify current robot state for context (remove heavy UI stuff if any, keep structure)
  const contextRobot = {
      name: currentRobot.name,
      links: Object.values(currentRobot.links).map(l => ({
          id: l.id, name: l.name, visual: l.visual, inertial: l.inertial
      })),
      joints: Object.values(currentRobot.joints).map(j => ({
          id: j.id, name: j.name, type: j.type, parent: j.parentLinkId, child: j.childLinkId, 
          origin: j.origin, axis: j.axis, limit: j.limit, hardware: j.hardware
      })),
      rootId: currentRobot.rootLinkId
  };

  const contextLibrary = Object.entries(motorLibrary).map(([brand, motors]) => ({
      brand,
      motors: motors.map(m => ({ name: m.name, effort: m.effort, velocity: m.velocity, weight: m.armature })) // simplified specs
  }));

  const systemPrompt = `
  You are an expert Robotics Engineer and URDF Architect.
  
  Your capabilities:
  1. **Generate**: Create new robot structures from scratch.
  2. **Modify**: specific parts of the existing robot (e.g., "Add a lidar to the base", "Make the legs longer", "Change joint 1 to use a Unitree motor").
  3. **Advice**: Analyze the robot and suggest improvements or hardware selection (e.g., "Is this motor strong enough?", "Calculate estimated torque").

  **Context Data:**
  - Current Robot Structure: ${JSON.stringify(contextRobot)}
  - Available Motor Library: ${JSON.stringify(contextLibrary)}

  **Instructions:**
  - If the user asks for a *new* robot, generate a complete new structure.
  - If the user asks to *modify*, return the FULL robot structure with the requested changes applied. Preserve existing IDs where possible.
  - If the user asks for *advice* or *hardware selection*, provide a text explanation. You can still return a modified robot if you want to apply the suggested hardware automatically (e.g. updating motorType and limits).
  - Use "cylinder" or "box" primitives for links.
  - Ensure parent/child relationships form a valid tree.
  - For hardware changes, use the exact 'motorType' names from the library.
  `;

  // Schema definition
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      explanation: { type: Type.STRING, description: "A brief explanation of what was done or advice given." },
      actionType: { type: Type.STRING, enum: ['modification', 'generation', 'advice'] },
      // Optional: Only populate if actionType is modification or generation
      robotData: {
          type: Type.OBJECT,
          nullable: true,
          properties: {
            name: { type: Type.STRING },
            links: {
                type: Type.ARRAY,
                items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    visualType: { type: Type.STRING, enum: ['box', 'cylinder', 'sphere'] },
                    dimensions: { type: Type.ARRAY, items: { type: Type.NUMBER } }, // [x, y, z]
                    color: { type: Type.STRING },
                    mass: { type: Type.NUMBER }
                }
                }
            },
            joints: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        name: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ['revolute', 'fixed', 'prismatic', 'continuous'] },
                        parentLinkId: { type: Type.STRING },
                        childLinkId: { type: Type.STRING },
                        originXYZ: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                        originRPY: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                        axis: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                        motorType: { type: Type.STRING, nullable: true }, // Optional hardware update
                        lowerLimit: { type: Type.NUMBER, nullable: true },
                        upperLimit: { type: Type.NUMBER, nullable: true },
                        effortLimit: { type: Type.NUMBER, nullable: true },
                        velocityLimit: { type: Type.NUMBER, nullable: true }
                    }
                }
            },
            rootLinkId: { type: Type.STRING }
          }
      }
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const text = response.text;
    if (!text) return null;
    
    // JSON Extraction Logic
    let jsonString = '';
    const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      jsonString = jsonBlockMatch[1];
    } else {
      const firstOpen = text.indexOf('{');
      const lastClose = text.lastIndexOf('}');
      if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
        jsonString = text.substring(firstOpen, lastClose + 1);
      }
    }
    
    if (!jsonString) return null;

    const result = JSON.parse(jsonString);
    const data = result.robotData;

    // If there is data, parse it back to our full State format
    let finalRobotState: Partial<RobotState> | undefined = undefined;

    if (data) {
        const newLinks: Record<string, any> = {};
        const newJoints: Record<string, any> = {};

        if (data.links && Array.isArray(data.links)) {
            data.links.forEach((l: any) => {
                const visualType = l.visualType as GeometryType;
                const dimensions = { x: l.dimensions?.[0] || 0.1, y: l.dimensions?.[1] || 0.1, z: l.dimensions?.[2] || 0.1 };
                
                newLinks[l.id] = {
                    id: l.id,
                    name: l.name,
                    inertial: {
                        mass: l.mass || 1.0,
                        inertia: { ixx: 0.1, ixy: 0, ixz: 0, iyy: 0.1, iyz: 0, izz: 0.1 }
                    },
                    visual: {
                        type: visualType,
                        dimensions: dimensions,
                        color: l.color || '#3b82f6',
                        origin: { xyz: {x:0,y:0,z:0}, rpy: {r:0,p:0,y:0} }
                    },
                    collision: {
                        type: visualType,
                        dimensions: dimensions,
                        color: '#ef4444',
                        origin: { xyz: {x:0,y:0,z:0}, rpy: {r:0,p:0,y:0} }
                    }
                };
            });
        }

        if (data.joints && Array.isArray(data.joints)) {
            data.joints.forEach((j: any) => {
                newJoints[j.id] = {
                    id: j.id,
                    name: j.name,
                    type: j.type as JointType,
                    parentLinkId: j.parentLinkId,
                    childLinkId: j.childLinkId,
                    origin: {
                        xyz: { x: j.originXYZ?.[0] || 0, y: j.originXYZ?.[1] || 0, z: j.originXYZ?.[2] || 0 },
                        rpy: { r: j.originRPY?.[0] || 0, p: j.originRPY?.[1] || 0, y: j.originRPY?.[2] || 0 }
                    },
                    axis: { x: j.axis?.[0] || 0, y: j.axis?.[1] || 0, z: j.axis?.[2] || 1 },
                    limit: { 
                        lower: j.lowerLimit ?? -1.57, 
                        upper: j.upperLimit ?? 1.57, 
                        effort: j.effortLimit ?? 100, 
                        velocity: j.velocityLimit ?? 10 
                    },
                    dynamics: { damping: 0, friction: 0 },
                    hardware: { 
                        armature: 0, 
                        motorType: j.motorType || 'None', 
                        motorId: '', 
                        motorDirection: 1 
                    }
                };
            });
        }

        finalRobotState = {
            name: data.name || "modified_robot",
            links: newLinks,
            joints: newJoints,
            rootLinkId: data.rootLinkId
        };
    }

    return {
        explanation: result.explanation,
        actionType: result.actionType,
        robotData: finalRobotState
    };

  } catch (e) {
    console.error("Gemini generation failed", e);
    return null;
  }
};
