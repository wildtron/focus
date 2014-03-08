/**
 * A Star Puzzle Solver
 * Raven John M. Lagrimas
 * 2010-43168
 * CMSC 170 U-7L
 */
 
import java.awt.*;
import java.awt.image.*;
import java.awt.event.*;
import javax.swing.*;
import java.util.*;
import java.io.*;

public class Moon implements ActionListener{

	private JFrame frame = new JFrame("Moon : A* Puzzle Solver");
	private Container container = frame.getContentPane();
	private JPanel panel = new JPanel(new GridLayout(3,3));
	private JButton[][] buttons = new JButton[3][3];
	
	private ArrayList<Node> openList = new ArrayList<Node>();
	private ArrayList<Node> closedList = new ArrayList<Node>();
	
	private String answer;

	public static void main(String args[]){
		new Moon();
	}
	
	protected Moon(){
		container.add(panel);	//add panel to container
		frame.setBounds(Settings.centerX,Settings.centerY,Settings.width,Settings.height);	//center the frame
		frame.setResizable(false);
		frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);	//set frame settings
		try{
			Scanner sc = new Scanner(new File("input.txt"));
			String puzzle = "";
			for(int i=0;i<3;i++){
				String line = sc.nextLine();
				for(int j=0,k=0;j<=4;j+=2,k++){
					puzzle += ""+line.charAt(j);
					panel.add(buttons[i][k] = new JButton(""+line.charAt(j)));
					buttons[i][k].setForeground(Color.black);
					buttons[i][k].setFont(new Font("Arial",Font.PLAIN,40));
					buttons[i][k].addActionListener(this);
					buttons[i][k].setBackground(Color.white);
				}
			}
			if(solve(puzzle)){
				System.out.println("SOLVED!");
				setNextButton();
			}else{
				System.out.println("No solution was found :(");
			}
		}catch(Exception e){
			e.printStackTrace();
		}
		frame.setVisible(true);
	}
	
	private void toggle(int x, int y){
		int v=x, w=y;
		if(x>0 && buttons[x-1][y].getText().equals("1")) v-=1;
		else if(x<2 && buttons[x+1][y].getText().equals("1")) v+=1;
		else if(y>0 && buttons[x][y-1].getText().equals("1")) w-=1;
		else if(y<2 && buttons[x][y+1].getText().equals("1")) w+=1;
		if(v!=x || w!=y){
			buttons[x][y].setBackground(Color.white);
			buttons[v][w].setText(""+buttons[x][y].getText());
			buttons[x][y].setText("1");
		}
		answer = answer.substring(1);
		setNextButton();
	}
	
	public void actionPerformed(ActionEvent e){
		if(answer.length() > 0 && ((JButton)e.getSource()).getText().equals(""+answer.charAt(0))){
			for(int i=0;i<3;i++)
				for(int j=0;j<3;j++)
					if(buttons[i][j] == (JButton)e.getSource())	
						toggle(i,j);
		}
	}
	
	public void setNextButton(){
		if(answer.length() > 0){
			for(int j=0;j<3;j++){
				for(int k=0;k<3;k++){
					if(buttons[j][k].getText().equals(""+answer.charAt(0))){
						buttons[j][k].setBackground(Color.red);
					}
				}
			}
		}
	}
	
	private boolean solve(String puzzle){
		openList.add(new Node(puzzle,0));
		Node bestNode = getBestNode();
		while(!openList.isEmpty()){
			openList.remove(bestNode);
			closedList.add(bestNode);
			if(bestNode.getPuzzle().equals("123456789")){
				answer = bestNode.getMoves();
				return true;
			}else{
				if(generateSuccessors(bestNode))
					bestNode = getBestNode();
				else
					break;
			}
		}
		return false;
	}
	
	private Node getBestNode(){
		Node min;
		min = openList.get(0);
		for(Node a : openList){
			if(a.getTotalCost() < min.getTotalCost()) min = a;
			else if(a.getTotalCost() == min.getTotalCost())
				if(a.getPathCost() < min.getPathCost()) min = a;
		}
		return min;
	}
	
	private boolean generateSuccessors(Node nd){
		int gen = 0;
		String puzzle = nd.getPuzzle();
		for(int i=0;i<puzzle.length();i++){
			if(puzzle.charAt(i)=='1'){
				if(i%3 > 0) gen += addSuccessor(puzzle.charAt(i-1),puzzle,nd);
				if(i%3 < 2) gen += addSuccessor(puzzle.charAt(i+1),puzzle,nd);
				if(i/3 > 0) gen += addSuccessor(puzzle.charAt(i-3),puzzle,nd);
				if(i/3 < 2) gen += addSuccessor(puzzle.charAt(i+3),puzzle,nd);
				break;
			}
		}
		return gen > 0;
	}
	
	private int addSuccessor(char t, String puzzle, Node nd){
		int pc = nd.getPathCost();
		String s = new String(puzzle);
		s = s.replace(t,'#').replace('1',t).replace('#','1');
		Node temp = new Node(s,pc+1);
		if(inClosedList(s))
			return 0;
		temp.setMoves(nd.getMoves()+t);
		openList.add(temp);
		return 1;
	}
	
	private boolean inClosedList(String puzzle){
		for(Node a : closedList){
			if(a.getPuzzle().equals(puzzle))
				return true;
		}
		return false;
	}
}

class Node{
	private int pathCost;
	private int manhattanDistance;
	private String puzzle;
	private String moves;
	
	protected Node(String puzzle, int pathCost){
		this.puzzle = puzzle;
		this.pathCost = pathCost;
		this.moves = new String();
		this.manhattanDistance = 0;
		this.computeManhattanDistance();
	}
	
	protected String getPuzzle(){
		return this.puzzle;
	}
	
	protected int getTotalCost(){
		return this.pathCost + this.manhattanDistance;
	}	
	
	protected int getPathCost(){
		return this.pathCost;
	}
	
	protected int getManhattanDistance(){
		return this.manhattanDistance;
	}
	
	protected String getMoves(){
		return this.moves;
	}
	
	protected void setMoves(String moves){
		this.moves = moves;
	}
	
	protected void computeManhattanDistance(){
		for(int i=0;i<this.puzzle.length();i++){
			int x = Integer.parseInt(""+this.puzzle.charAt(i))-1;			
			this.manhattanDistance += Math.abs((i/3)-(x/3))+Math.abs((i%3)-(x%3));
		}
	}
	
	protected void print(){
		for(int i=0;i<9;i++){
			System.out.print(""+this.puzzle.charAt(i));
			if((i+1)%3==0)System.out.println();
		}
		System.out.println();
	}
	
	protected void printMoves(){
		System.out.print("moves : "+this.moves);
	}
}

class Settings{	//settings for screen width and height
	private static Toolkit tk = Toolkit.getDefaultToolkit();
    private static Dimension d = tk.getScreenSize();
	protected static final int screenWidth = d.width;
	protected static final int screenHeight = d.height;
	protected static final int width = 506;	//500px view
	protected static final int height = 525;	//500px view
	protected static final int centerX = (screenWidth-width)/2;
	protected static final int centerY = (screenHeight-height)/2;
}
