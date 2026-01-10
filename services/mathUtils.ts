import * as THREE from 'three';

/**
 * Math utilities class
 * Used for calculating eigenvalues, eigenvectors, etc.
 */
export class MathUtils {
    /**
     * Compute eigenvalue decomposition of 3x3 symmetric matrix (using Jacobi method)
     * @param {THREE.Matrix3} matrix - Symmetric matrix
     * @returns {Object} { eigenvalues: [λ1, λ2, λ3], eigenvectors: [[v1x, v1y, v1z], [v2x, v2y, v2z], [v3x, v3y, v3z]] }
     */
    static computeEigenDecomposition3x3(matrix: THREE.Matrix3) {
        const m = matrix.elements;

        // Copy matrix elements (assume symmetric matrix)
        let a00 = m[0], a01 = m[1], a02 = m[2];
        let a11 = m[4], a12 = m[5];
        let a22 = m[8];

        // Initialize eigenvector matrix as identity matrix
        let v00 = 1, v01 = 0, v02 = 0;
        let v10 = 0, v11 = 1, v12 = 0;
        let v20 = 0, v21 = 0, v22 = 1;

        // Jacobi iteration
        const maxIterations = 50;
        for (let iter = 0; iter < maxIterations; iter++) {
            // Find largest off-diagonal element
            let maxVal = Math.abs(a01);
            let p = 0, q = 1;

            if (Math.abs(a02) > maxVal) {
                maxVal = Math.abs(a02);
                p = 0; q = 2;
            }
            if (Math.abs(a12) > maxVal) {
                maxVal = Math.abs(a12);
                p = 1; q = 2;
            }

            // If off-diagonal elements are small enough, stop iteration
            if (maxVal < 1e-10) break;

            // Calculate rotation angle
            let apq, app, aqq;
            if (p === 0 && q === 1) {
                apq = a01; app = a00; aqq = a11;
            } else if (p === 0 && q === 2) {
                apq = a02; app = a00; aqq = a22;
            } else {
                apq = a12; app = a11; aqq = a22;
            }

            const tau = (aqq - app) / (2 * apq);
            const t = Math.sign(tau) / (Math.abs(tau) + Math.sqrt(1 + tau * tau));
            const c = 1 / Math.sqrt(1 + t * t);
            const s = t * c;

            // Update matrix elements
            if (p === 0 && q === 1) {
                const temp00 = a00, temp01 = a01, temp02 = a02;
                const temp11 = a11, temp12 = a12;

                a00 = c * c * temp00 - 2 * c * s * temp01 + s * s * temp11;
                a11 = s * s * temp00 + 2 * c * s * temp01 + c * c * temp11;
                a01 = 0;
                a02 = c * temp02 - s * temp12;
                a12 = s * temp02 + c * temp12;

                // Update eigenvectors
                const tv00 = v00, tv01 = v01, tv02 = v02;
                const tv10 = v10, tv11 = v11, tv12 = v12;
                const tv20 = v20, tv21 = v21, tv22 = v22;

                v00 = c * tv00 - s * tv10;
                v01 = c * tv01 - s * tv11;
                v02 = c * tv02 - s * tv12;
                v10 = s * tv00 + c * tv10;
                v11 = s * tv01 + c * tv11;
                v12 = s * tv02 + c * tv12;
            } else if (p === 0 && q === 2) {
                const temp00 = a00, temp01 = a01, temp02 = a02;
                const temp12 = a12, temp22 = a22;

                a00 = c * c * temp00 - 2 * c * s * temp02 + s * s * temp22;
                a22 = s * s * temp00 + 2 * c * s * temp02 + c * c * temp22;
                a02 = 0;
                a01 = c * temp01 - s * temp12;
                a12 = s * temp01 + c * temp12;

                // Update eigenvectors
                const tv00 = v00, tv01 = v01, tv02 = v02;
                const tv10 = v10, tv11 = v11, tv12 = v12;
                const tv20 = v20, tv21 = v21, tv22 = v22;

                v00 = c * tv00 - s * tv20;
                v01 = c * tv01 - s * tv21;
                v02 = c * tv02 - s * tv22;
                v20 = s * tv00 + c * tv20;
                v21 = s * tv01 + c * tv21;
                v22 = s * tv02 + c * tv22;
            } else { // p === 1 && q === 2
                const temp11 = a11, temp01 = a01, temp12 = a12;
                const temp02 = a02, temp22 = a22;

                a11 = c * c * temp11 - 2 * c * s * temp12 + s * s * temp22;
                a22 = s * s * temp11 + 2 * c * s * temp12 + c * c * temp22;
                a12 = 0;
                a01 = c * temp01 - s * temp02;
                a02 = s * temp01 + c * temp02;

                // Update eigenvectors
                const tv00 = v00, tv01 = v01, tv02 = v02;
                const tv10 = v10, tv11 = v11, tv12 = v12;
                const tv20 = v20, tv21 = v21, tv22 = v22;

                v10 = c * tv10 - s * tv20;
                v11 = c * tv11 - s * tv21;
                v12 = c * tv12 - s * tv22;
                v20 = s * tv10 + c * tv20;
                v21 = s * tv11 + c * tv21;
                v22 = s * tv12 + c * tv22;
            }
        }

        return {
            eigenvalues: [a00, a11, a22],
            eigenvectors: [
                [v00, v01, v02],
                [v10, v11, v12],
                [v20, v21, v22]
            ]
        };
    }

    /**
     * Compute box dimensions corresponding to inertia matrix (like Gazebo)
     * Based on principal moments of inertia matrix, compute equivalent box dimensions
     * @returns {Object|null} Returns box data, or null if inertia parameters are unreasonable (don't display)
     */
    static computeInertiaBox(inertial: any) {
        const Ixx = inertial.inertia.ixx || 0;
        const Iyy = inertial.inertia.iyy || 0;
        const Izz = inertial.inertia.izz || 0;
        const Ixy = inertial.inertia.ixy || 0;
        const Ixz = inertial.inertia.ixz || 0;
        const Iyz = inertial.inertia.iyz || 0;
        const mass = inertial.mass || 1;

        // Reasonableness check 1: Mass too small
        const minMassThreshold = 0.01; // 10g
        if (mass < minMassThreshold) {
            const avgInertia = (Math.abs(Ixx) + Math.abs(Iyy) + Math.abs(Izz)) / 3;
            // Characteristic inertia radius
            const inertiaRadius = mass > 0 ? Math.sqrt(avgInertia / mass) : 0; 
            
            if (inertiaRadius > 0.05) {
                return null;
            }
        }

        // Reasonableness check 2: All inertia values close to zero
        const inertiaThreshold = 1e-9;
        if (Math.abs(Ixx) < inertiaThreshold &&
            Math.abs(Iyy) < inertiaThreshold &&
            Math.abs(Izz) < inertiaThreshold) {
            return null;
        }

        // Check if there are off-diagonal components
        const hasOffDiagonal = Math.abs(Ixy) > 1e-10 || Math.abs(Ixz) > 1e-10 || Math.abs(Iyz) > 1e-10;

        let principalInertias: number[];
        let rotation = new THREE.Quaternion(); // Default no rotation

        if (hasOffDiagonal) {
            // Has off-diagonal components, need eigenvalue decomposition
            const matrix = new THREE.Matrix3();
            matrix.set(
                Ixx, Ixy, Ixz,
                Ixy, Iyy, Iyz,
                Ixz, Iyz, Izz
            );

            // Calculate eigenvalues and eigenvectors
            const eigen = this.computeEigenDecomposition3x3(matrix);
            principalInertias = eigen.eigenvalues;

            // Build rotation matrix from eigenvector matrix
            const rotMatrix = new THREE.Matrix4();
            rotMatrix.set(
                eigen.eigenvectors[0][0], eigen.eigenvectors[1][0], eigen.eigenvectors[2][0], 0,
                eigen.eigenvectors[0][1], eigen.eigenvectors[1][1], eigen.eigenvectors[2][1], 0,
                eigen.eigenvectors[0][2], eigen.eigenvectors[1][2], eigen.eigenvectors[2][2], 0,
                0, 0, 0, 1
            );
            rotation.setFromRotationMatrix(rotMatrix);
        } else {
            // No off-diagonal components, use diagonal values directly
            principalInertias = [Ixx, Iyy, Izz];
        }

        const factor = 6.0 / mass;

        let width = Math.sqrt(Math.abs(factor * (principalInertias[1] + principalInertias[2] - principalInertias[0])));
        let height = Math.sqrt(Math.abs(factor * (principalInertias[0] + principalInertias[2] - principalInertias[1])));
        let depth = Math.sqrt(Math.abs(factor * (principalInertias[0] + principalInertias[1] - principalInertias[2])));

        // Reasonableness check 3: Check ratio between inertia radius and box size
        const avgInertia = (Math.abs(principalInertias[0]) + Math.abs(principalInertias[1]) + Math.abs(principalInertias[2])) / 3;
        const inertiaRadius = Math.sqrt(avgInertia / mass);
        const avgBoxSize = (width + height + depth) / 3;

        if (inertiaRadius > avgBoxSize) {
            return null; 
        }

        // Reasonableness check 4: Check if equivalent density is reasonable
        const volume = width * height * depth;
        // Avoid division by zero
        const equivalentDensity = volume > 0 ? mass / volume : 0; 
        
        const minDensity = 0.0001; 
        if (equivalentDensity < minDensity) {
           return null;
        }

        // Set minimum size
        const minSize = 0.01;
        width = Math.max(width, minSize);
        height = Math.max(height, minSize);
        depth = Math.max(depth, minSize);

        // If all inertias very small, use default small box
        if (width < minSize && height < minSize && depth < minSize) {
            width = height = depth = 0.05;
        }

        return {
            width: width,   // x direction
            height: height, // y direction
            depth: depth,   // z direction
            rotation: rotation
        };
    }
}
